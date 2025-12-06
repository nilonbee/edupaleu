import React from 'react';
import { useAppDispatch } from '@/app/redux';
import { setCurrentStep, resetApplication } from '@/state/applicationSlice';

interface ErrorViewProps {
  currentStep: number;
  totalSteps: number;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ currentStep, totalSteps }) => {
  const dispatch = useAppDispatch();

  const handleRestart = () => {
    dispatch(setCurrentStep(0));
    dispatch(resetApplication());
    localStorage.removeItem('applicationWizard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="text-red-500 text-6xl mb-4">⚠</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Error</h2>
        <p className="text-gray-600 mb-4">
          There was a problem loading the application form.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Step {currentStep + 1} of {totalSteps}
        </p>
        <button
          onClick={handleRestart}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Restart Application
        </button>
      </div>
    </div>
  );
};

