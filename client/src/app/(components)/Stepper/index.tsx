// components/Stepper.tsx
import React from "react";

interface StepperProps {
  currentStep: number;
  steps: { title: string }[];
  completedSteps: number[];
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  steps,
  completedSteps,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.title}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                  index === currentStep
                    ? "bg-blue-600 border-blue-600 text-white"
                    : completedSteps.includes(index)
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-white border-gray-300 text-gray-500"
                }`}
              >
                {completedSteps.includes(index) ? (
                  <svg
                    className="w-5 h-5"
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
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  index === currentStep
                    ? "text-blue-600"
                    : completedSteps.includes(index)
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 ${
                  completedSteps.includes(index + 1)
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
