import React, { memo } from "react";
import Button from "@/app/(components)/Button";

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

export const NavigationButtons: React.FC<NavigationButtonsProps> = memo(
  ({
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
          <Button
            type="button"
            onClick={onBack}
            disabled={currentStep === 0}
            variant="secondary"
            size="md"
          >
            Back
          </Button>

          {!isLastStep ? (
            <Button
              type="button"
              onClick={onNext}
              disabled={isLoading}
              variant="primary"
              size="md"
              isLoading={isLoading}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting || isLoading}
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Submit Application
            </Button>
          )}
        </div>

        {error && (
          <div
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md"
            role="alert"
          >
            <p className="text-red-700 text-sm">
              Error submitting application. Please try again.
            </p>
          </div>
        )}
      </>
    );
  }
);

NavigationButtons.displayName = "NavigationButtons";
