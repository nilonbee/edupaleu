import React from 'react';

interface SuccessViewProps {
  onComplete?: () => void;
  message?: string;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  onComplete,
  message = 'Application Submitted Successfully!',
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{message}</h2>
        <p className="text-gray-600 mb-6">
          Your application has been received and is being processed.
        </p>
        {onComplete && (
          <button
            onClick={onComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Applications
          </button>
        )}
      </div>
    </div>
  );
};

