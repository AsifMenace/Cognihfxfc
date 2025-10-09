import React from "react";

type UpdatePromptProps = {
  show: boolean;
  onRefresh: () => void;
};

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({
  show,
  onRefresh,
}) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-blue-700 text-white px-6 py-3 rounded shadow-lg flex items-center gap-4">
      <span>New version available.</span>
      <button
        className="ml-4 px-3 py-1 rounded bg-white text-blue-700 font-semibold"
        onClick={onRefresh}
      >
        Reload
      </button>
    </div>
  );
};
