import React, { useEffect } from 'react';

type FlashType = 'info' | 'success' | 'error';

interface FlashProps {
  message: string;
  type?: FlashType;
  onClose: () => void;
}

const palette: Record<FlashType, { bg: string; text: string; border: string }> = {
  info: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  success: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  error: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
};

const Flash: React.FC<FlashProps> = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = palette[type];

  return (
    <div className={`mx-auto max-w-4xl px-4`}>
      <div className={`mt-3 border ${colors.border} ${colors.bg} ${colors.text} rounded-lg px-4 py-3 shadow-sm flex items-start justify-between`}>
        <div className="pr-3 text-sm font-medium">{message}</div>
        <button onClick={onClose} className={`text-sm font-semibold opacity-70 hover:opacity-100`}>×</button>
      </div>
    </div>
  );
};

export default Flash;


