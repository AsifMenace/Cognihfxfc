import React from 'react';
import { RefreshCw } from 'lucide-react';

type UpdatePromptProps = {
  show: boolean;
  onRefresh: () => void;
};

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({ show, onRefresh }) => {
  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 bg-amber-500 px-4 py-3 shadow-lg shadow-amber-500/40">
      <div className="flex items-center gap-2 text-white font-semibold text-sm">
        <RefreshCw size={16} className="flex-shrink-0 animate-spin" style={{ animationDuration: '2s' }} />
        <span>New version available — update for latest changes</span>
      </div>
      <button
        onClick={onRefresh}
        className="flex-shrink-0 rounded-lg bg-white px-4 py-1.5 text-sm font-black text-amber-600 shadow-md animate-pulse"
      >
        Update
      </button>
    </div>
  );
};
