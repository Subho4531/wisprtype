import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Trash2, Copy, Search, Inbox } from "lucide-react";
import { Card } from "../cards/Card";
import { TranscriptionEntry } from "../../types";
import { useToast } from "../../hooks/useToast";
import { ConfirmModal } from "../ui/ConfirmModal";

interface HistoryTabProps {
  history: TranscriptionEntry[];
  loadHistory: () => Promise<void>;
}

const HistoryEntryCard = ({ entry, deleteEntry, copyToClipboard }: { entry: TranscriptionEntry, deleteEntry: (id: string) => void, copyToClipboard: (text: string) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const isLongText = entry.text.length > 150;
  
  return (
    <div className={`border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 shadow-sm transition-colors group flex flex-col justify-between h-auto min-h-[13rem]`}>
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{entry.timestamp}</span>
          <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-zinc-600 dark:text-zinc-300 font-medium rounded-full">{entry.word_count} words</span>
        </div>
        <p className={`text-base text-zinc-700 dark:text-zinc-300 leading-relaxed ${!expanded && isLongText ? 'line-clamp-3' : ''}`}>{entry.text}</p>
        {isLongText && (
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="text-sm font-medium text-orange-500 hover:text-orange-600 mt-2 transition-colors"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button onClick={() => deleteEntry(entry.id)} className="p-2 text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors rounded-lg border border-transparent hover:border-red-100 dark:hover:border-red-900/30" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
        <button onClick={() => copyToClipboard(entry.text)} className="px-3 py-2 flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors text-xs font-medium rounded-lg shadow-sm" title="Copy Text">
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
      </div>
    </div>
  );
};

export const HistoryTab: React.FC<HistoryTabProps> = ({ history, loadHistory }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const filteredHistory = history.filter(entry => entry.text.toLowerCase().includes(searchQuery.toLowerCase()));

  const deleteEntry = async (id: string) => {
    try {
      await invoke("delete_history_entry", { id });
      await loadHistory();
      toast("Entry deleted", "info");
    } catch (e) {
      console.error("Failed to delete entry:", e);
      toast("Failed to delete entry", "error");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard!", "success");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast("Failed to copy text", "error");
    }
  };

  const handleClearHistory = async () => {
    try {
      await invoke("clear_history");
      await loadHistory();
      setIsConfirmOpen(false);
      toast("History cleared", "info");
    } catch (e) {
      console.error("Failed to clear history:", e);
      toast("Failed to clear history", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors">
      <Card title="Transcription Archive" className="min-h-[600px]">
        <div className="mt-4 flex flex-col gap-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full !pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors text-sm text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase">
              {filteredHistory.length} Record(s) Found
            </span>
            {history.length > 0 && (
              <button 
                onClick={() => setIsConfirmOpen(true)} 
                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear All
              </button>
            )}
          </div>
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <Inbox className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" strokeWidth={1.5} />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                {history.length === 0 ? "No transcriptions yet" : "No matching records"}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {history.length === 0 ? "Your completed voice captures will appear here." : "Try adjusting your search terms."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredHistory.map((entry) => (
                <HistoryEntryCard 
                  key={entry.id} 
                  entry={entry} 
                  deleteEntry={deleteEntry} 
                  copyToClipboard={copyToClipboard} 
                />
              ))}
            </div>
          )}
        </div>
      </Card>
      
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Clear Archive"
        message="Are you sure you want to delete all transcription records? This action cannot be undone."
        onConfirm={handleClearHistory}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
