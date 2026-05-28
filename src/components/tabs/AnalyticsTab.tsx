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
import { Inbox } from "lucide-react";
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
    <div className="grid grid-cols-1 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 mb-24 transition-colors">
      <Card title="Word Frequency Analytics" className="min-h-[600px]">
        <div className="mt-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            Frequency analysis of your most used words across all transcription sessions.
          </p>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Inbox className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" strokeWidth={1.5} />
              <p className="text-zinc-400 dark:text-zinc-500 text-sm text-center">No data yet. Start transcribing to see your word frequency analytics.</p>
            </div>
          ) : (
            <>
              <div className="h-full min-h-[500px] w-full text-black dark:text-white">
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={sortedWords} layout="vertical" margin={{ top: 20, right: 20, bottom: 10, left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-zinc-300 dark:text-zinc-700" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12, fontWeight: '500' }} className="text-zinc-500 dark:text-zinc-400" />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 13, fontWeight: '600' }} className="text-zinc-900 dark:text-zinc-100" width={80} interval={0} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} 
                      contentStyle={{ borderRadius: 0, border: '1px solid #000', background: '#000', color: '#fff' }} 
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }} 
                    />
                    <Bar dataKey="val" fill="currentColor" radius={[0, 0, 0, 0]} barSize={24} />
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
