import React from 'react';

interface VideoCallButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  isInCall?: boolean;
}

export const VideoCallButton: React.FC<VideoCallButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
  isInCall = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
        isInCall
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <span className="mr-2">
        {isInCall ? '📞' : '📹'}
      </span>
      {isInCall ? 'End Call' : 'Video Call'}
    </button>
  );
}; 