import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { UploadCloud, Trophy, BarChart3 } from 'lucide-react';
import { processCsvData } from './utils/zscore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function App() {
  const [leaderboard, setLeaderboard] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (file) => {
    Papa.parse(file, {
      header: false,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data;
          if (!data || data.length === 0) {
            throw new Error("CSV file is empty or invalid.");
          }
          const { leaderboard: lb } = processCsvData(data);
          setLeaderboard(lb);
          setError(null);
        } catch (err) {
          console.error(err);
          setError(err.message);
        }
      },
      error: (err) => {
        setError(err.message);
      }
    });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const topTeams = leaderboard ? leaderboard.slice(0, 10) : [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-blue-600/20 rounded-full mb-4">
            <Trophy className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Z-Score Normalizer
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Upload your judging data to instantly eliminate human bias and generate a standardized, fair leaderboard.
          </p>
        </header>

        {/* Upload Zone */}
        {!leaderboard && (
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center min-h-[400px]
              ${isDragging ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-500'}`}
          >
            <UploadCloud className={`w-20 h-20 mb-6 transition-colors duration-300 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
            <h3 className="text-2xl font-semibold mb-2">Drag & Drop your CSV file</h3>
            <p className="text-slate-400 mb-8 text-lg">or click to browse from your computer</p>
            <label className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-medium cursor-pointer transition-colors shadow-lg shadow-blue-500/25">
              Select File
              <input type="file" accept=".csv" className="hidden" onChange={onFileChange} />
            </label>
            {error && (
              <div className="mt-8 text-red-400 bg-red-400/10 px-6 py-3 rounded-lg border border-red-400/20">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Results Dashboard */}
        {leaderboard && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <h2 className="text-xl font-semibold px-4">Analysis Complete</h2>
              <label className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors">
                Upload New Data
                <input type="file" accept=".csv" className="hidden" onChange={onFileChange} />
              </label>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Leaderboard Table */}
              <div className="lg:col-span-2 bg-slate-800/50 rounded-3xl border border-slate-700 overflow-hidden shadow-xl backdrop-blur-sm">
                <div className="p-6 border-b border-slate-700 flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-xl font-bold">Official Leaderboard</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/80 text-slate-400 text-sm uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Rank</th>
                        <th className="px-6 py-4 font-semibold">Team</th>
                        <th className="px-6 py-4 font-semibold">Judge(s)</th>
                        <th className="px-6 py-4 font-semibold text-right">Raw Total</th>
                        <th className="px-6 py-4 font-semibold text-right">Z-Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {leaderboard.map((row, idx) => (
                        <tr 
                          key={idx} 
                          className={`hover:bg-slate-700/30 transition-colors ${idx < 3 ? 'bg-blue-500/5' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <span className={`
                              inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                              ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : ''}
                              ${idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' : ''}
                              ${idx === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : ''}
                              ${idx > 2 ? 'text-slate-500' : ''}
                            `}>
                              {row.Rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-200">{row.Team}</td>
                          <td className="px-6 py-4 text-slate-400 text-sm truncate max-w-[150px]" title={row.Judges}>
                            {row.Judges}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-slate-300">
                            {row.Raw_Total_Score.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-blue-400">
                            {row.Z_Score.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chart Visualization */}
              <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-6 flex flex-col shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-xl font-bold">Top 10 Z-Scores</h3>
                </div>
                <div className="flex-1 min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topTeams} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="Team" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                        itemStyle={{ color: '#60a5fa' }}
                        cursor={{ fill: '#334155', opacity: 0.4 }}
                      />
                      <Bar 
                        dataKey="Z_Score" 
                        fill="#3b82f6" 
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
