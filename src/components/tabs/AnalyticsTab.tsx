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

  return (
    <div className="grid grid-cols-1 gap-px bg-zinc-200 border border-zinc-200 mb-24">
      <Card title="Cognitive Linguistics Analytics" className="min-h-[600px]">
        <div className="mt-4">
          <p className="text-xs font-mono text-zinc-500 mb-8">
            Frequency analysis of recognized phonetic structures across all recorded sessions.
          </p>
          {history.length === 0 ? (
            <div className="text-zinc-400 text-sm font-mono text-center py-20">Insufficient data for linguistic analysis.</div>
          ) : (
            <div className="h-full min-h-[400px] w-full">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={sortedWords} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#18181b', fontSize: 12, fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: 0, border: '1px solid #e4e4e7', boxShadow: 'none' }} />
                  <Bar dataKey="val" fill="#18181b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
