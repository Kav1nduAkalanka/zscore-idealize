export function processCsvData(data) {
  // data is an array of arrays because header: false
  
  const enrichedData = [];
  let currentJudge = "Unknown Judge";

  // 1. Parse rows and calculate Total_Score for each team row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows
    if (!row || row.length === 0) continue;
    
    // Update current judge if column 0 is present and not 'Judge' (the header)
    if (row[0] && typeof row[0] === 'string' && row[0].trim() !== '' && row[0].trim() !== 'Judge') {
      currentJudge = row[0].trim();
    }

    const teamName = row[1] ? (typeof row[1] === 'string' ? row[1].trim() : row[1]) : '';
    
    // Skip header rows or rows without a team name
    if (!teamName || teamName === 'Teams' || teamName === 'Teams ') continue;
    
    let totalScore = 0;
    let hasValidScores = false;

    // The 'Total' column for the real competition data format is at index 10
    // (Judge=0, Team=1, 8 score categories=2-9, Total=10).
    const potentialTotal = parseFloat(row[10]);
    if (!isNaN(potentialTotal)) {
      totalScore = potentialTotal;
      hasValidScores = true;
    } else {
      // Fallback: sum all 8 score category columns (index 2 to 9)
      for (let j = 2; j <= 9; j++) {
        const cell = row[j];
        const num = parseFloat(cell);
        if (!isNaN(num)) {
          totalScore += num;
          hasValidScores = true;
        }
      }
    }

    if (hasValidScores) {
      enrichedData.push({
        Judge: currentJudge,
        Teams: teamName,
        Total_Score: totalScore
      });
    }
  }

  // 2. Group by Judge and calculate Mean and SD of Total_Score
  const judgeStats = {};
  
  // Group
  enrichedData.forEach(row => {
    const judge = row.Judge;
    if (!judgeStats[judge]) judgeStats[judge] = { scores: [] };
    judgeStats[judge].scores.push(row.Total_Score);
  });

  // Calculate Mean and SD
  for (const judge in judgeStats) {
    const scores = judgeStats[judge].scores;
    const n = scores.length;
    const mean = n > 0 ? scores.reduce((a, b) => a + b, 0) / n : 0;
    
    // Population Standard Deviation
    const variance = n > 0 ? scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n : 0;
    const sd = Math.sqrt(variance);
    
    judgeStats[judge].mean = mean;
    judgeStats[judge].sd = sd;
  }

  // 3. Calculate Z-Score
  const finalData = enrichedData.map(row => {
    const stats = judgeStats[row.Judge];
    let zScore = 0;
    if (stats && stats.sd > 0) {
      zScore = (row.Total_Score - stats.mean) / stats.sd;
    }
    return {
      ...row,
      Z_Score: zScore
    };
  });

  // 4. Create Unified Leaderboard (sort by Z-Score descending)
  const teamZScores = {};
  finalData.forEach(row => {
    const team = row.Teams;
    if (!teamZScores[team]) {
      teamZScores[team] = {
        Team: team,
        rawScores: [],
        zScores: [],
        judges: []
      };
    }
    teamZScores[team].rawScores.push(row.Total_Score);
    teamZScores[team].zScores.push(row.Z_Score);
    if (!teamZScores[team].judges.includes(row.Judge)) {
      teamZScores[team].judges.push(row.Judge);
    }
  });

  const leaderboard = Object.values(teamZScores).map(teamData => {
    const avgZ = teamData.zScores.reduce((a, b) => a + b, 0) / teamData.zScores.length;
    const totalRaw = teamData.rawScores.reduce((a, b) => a + b, 0);
    return {
      Team: teamData.Team,
      Judges: teamData.judges.join(', '),
      Raw_Total_Score: totalRaw,
      Z_Score: avgZ
    };
  });

  leaderboard.sort((a, b) => b.Z_Score - a.Z_Score);

  // Assign Rank
  leaderboard.forEach((item, index) => {
    item.Rank = index + 1;
  });

  return { finalData, leaderboard };
}