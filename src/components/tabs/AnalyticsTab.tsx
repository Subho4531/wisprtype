import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "../cards/Card";
import { TranscriptionEntry } from "../../types";

interface AnalyticsTabProps {
  history: TranscriptionEntry[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ history }) => {
  const sortedWords = useMemo(() => {
    const stopWords = new Set(["the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me"]);
    const wordCounts: Record<string, number> = {};
    history.forEach(entry => {
      const words = entry.text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
      words.forEach((w: string) => {
        if (w.length > 2 && !stopWords.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
    });
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, val]) => ({ name, val }));
  }, [history]);

  const topWord = sortedWords[0];

  return (
    <div className="grid grid-cols-1 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 mb-24 transition-colors">
      <Card title="Word Frequency Analytics" className="min-h-[600px]">
        <div className="mt-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            Frequency analysis of your most used words across all transcription sessions.
          </p>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="text-4xl mb-4">📊</span>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm text-center">No data yet. Start transcribing to see your word frequency analytics.</p>
            </div>
          ) : (
            <>
              {topWord && (
                <div className="mb-6 p-4 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Top Word</span>
                    <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{topWord.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{topWord.val} occurrences</span>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-end gap-0.5 h-8">
                      {sortedWords.slice(0, 8).map((w, i) => (
                        <div key={w.name} className="w-2 bg-orange-500 rounded-t" style={{ height: `${(w.val / topWord.val) * 100}%`, opacity: 1 - i * 0.1 }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="h-full min-h-[400px] w-full">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={sortedWords} layout="vertical" margin={{ left: 40, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-zinc-300 dark:text-zinc-800" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 'bold' }} className="text-zinc-500 dark:text-zinc-400" />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 'bold' }} className="text-zinc-500 dark:text-zinc-400" />
                    <Tooltip cursor={{ fill: 'rgba(249, 115, 22, 0.1)' }} contentStyle={{ borderRadius: 8, border: 'none', background: '#f97316', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Bar dataKey="val" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
