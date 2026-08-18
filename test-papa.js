import Papa from 'papaparse';
import fs from 'fs';
import { processCsvData } from './src/utils/zscore.js';

const file = fs.readFileSync('/content/Prototype Allocation - Open.csv', 'utf8');
const results = Papa.parse(file, {
  header: false,
  dynamicTyping: false,
  skipEmptyLines: true,
});

const { finalData, leaderboard } = processCsvData(results.data);
console.log(JSON.stringify(leaderboard.slice(0, 5), null, 2));
