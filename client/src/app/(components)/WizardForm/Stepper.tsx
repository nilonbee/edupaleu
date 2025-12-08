import React, { memo } from 'react';

interface Step {
  title: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

const StepperComponent: React.FC<StepperProps> = ({ steps, currentStep, completedSteps }) => {
  return (
    <div className="bg-gradient-to-br from-white via-slate-50/50 to-blue-50/40 dark:from-slate-800 dark:via-slate-800/90 dark:to-indigo-900/30 rounded-xl shadow-xl border border-slate-200/60 dark:border-slate-700/50 p-4 sm:p-6 mb-6">
      {/* Desktop Horizontal Layout */}
      <div className="hidden md:block w-full">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={`${step.title}-${index}`}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => {}}
                  disabled
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
                    index === currentStep
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-700 border-cyan-400 text-white shadow-lg shadow-cyan-500/50 scale-110 ring-2 ring-cyan-400/30'
                      : completedSteps.includes(index)
                      ? 'bg-gradient-to-br from-cyan-500 to-teal-600 border-cyan-400 text-white shadow-md'
                      : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                  }`}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                  aria-current={index === currentStep ? 'step' : undefined}
                >
                  {completedSteps.includes(index) ? (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </button>
                <span
                  className={`mt-3 text-xs sm:text-sm font-medium text-center px-1 ${
                    index === currentStep
                      ? 'text-blue-600 dark:text-cyan-400 font-bold'
                      : completedSteps.includes(index)
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                    completedSteps.includes(index + 1) || index < currentStep
                      ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile Vertical Layout - Improved */}
      <div className="md:hidden w-full">
        <div className="flex flex-col space-y-3">
          {steps.map((step, index) => (
            <React.Fragment key={`${step.title}-${index}-mobile`}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {}}
                    disabled
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold border-2 transition-all duration-300 flex-shrink-0 ${
                      index === currentStep
                        ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-700 border-cyan-400 text-white shadow-lg shadow-cyan-500/50 scale-110 ring-2 ring-cyan-400/30'
                        : completedSteps.includes(index)
                        ? 'bg-gradient-to-br from-cyan-500 to-teal-600 border-cyan-400 text-white shadow-md'
                        : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                    }`}
                    aria-label={`Step ${index + 1}: ${step.title}`}
                    aria-current={index === currentStep ? 'step' : undefined}
                  >
                    {completedSteps.includes(index) ? (
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-0.5 h-8 sm:h-10 my-1 rounded-full transition-all duration-300 ${
                        completedSteps.includes(index + 1) || index < currentStep
                          ? 'bg-gradient-to-b from-cyan-500 via-blue-500 to-indigo-500'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm sm:text-base font-medium block ${
                      index === currentStep
                        ? 'text-blue-600 dark:text-cyan-400 font-bold'
                        : completedSteps.includes(index)
                        ? 'text-cyan-600 dark:text-cyan-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                  {index === currentStep && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                      Current step
                    </span>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Stepper = memo(StepperComponent);
