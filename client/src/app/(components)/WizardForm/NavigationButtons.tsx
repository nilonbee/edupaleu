import React, { memo } from 'react';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
  error?: any;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = memo(({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
  error,
}) => {
  const isLastStep = currentStep >= totalSteps - 1;

  return (
    <>
      <div className="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onBack}
          disabled={currentStep === 0}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          aria-label="Go to previous step"
        >
          Back
        </button>

        {!isLastStep ? (
          <button
            type="button"
            onClick={onNext}
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700 hover:from-blue-700 hover:via-indigo-700 hover:to-slate-800 border border-blue-500/50 rounded-lg shadow-lg shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 disabled:opacity-50 transition-all duration-200"
            aria-label="Go to next step"
          >
            {isLoading ? 'Loading...' : 'Next'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || isLoading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700 hover:from-blue-700 hover:via-indigo-700 hover:to-slate-800 border border-blue-500/50 rounded-lg shadow-lg shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 disabled:opacity-50 transition-all duration-200"
            aria-label={isSubmitting ? 'Submitting application' : 'Submit application'}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
          <p className="text-red-700 text-sm">
            Error submitting application. Please try again.
          </p>
        </div>
      )}
    </>
  );
});

NavigationButtons.displayName = 'NavigationButtons';

