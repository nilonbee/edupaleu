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
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          disabled={currentStep === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          aria-label="Go to previous step"
        >
          Back
        </button>

        {!isLastStep ? (
          <button
            type="button"
            onClick={onNext}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-600 rounded shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-150"
            aria-label="Go to next step"
          >
            {isLoading ? 'Loading...' : 'Next'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-600 rounded shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-150"
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

