// components/WizardForm.tsx
"use client";
import React, { useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { useAppSelector } from "@/app/redux";
import { useCreateApplicationMutation, useUpdateApplicationMutation } from "@/state/applicationApi";
import { useApplicationForm } from "@/hooks/useApplicationForm";
import { useApplicationSubmission } from "@/hooks/useApplicationSubmission";
import { logger } from "@/utils/logger";

// Import steps
import {
  StudentSelection,
  StudentDetails,
  UniversitySelection,
  AcademicQualifications,
  DocumentsUpload,
  MaritalStatus,
  IntendedPrograms,
  ReviewSubmit,
} from "@/app/(components)/steps";

// Import components
import { Stepper } from "./Stepper";
import { NavigationButtons } from "./NavigationButtons";
import { SuccessView } from "./SuccessView";
import { ErrorView } from "./ErrorView";

interface WizardFormProps {
  applicationId?: string;
  onComplete?: () => void;
}

const steps = [
  { title: "Student", component: StudentSelection },
  { title: "Details", component: StudentDetails },
  { title: "University", component: UniversitySelection },
  { title: "Academic", component: AcademicQualifications },
  { title: "Documents", component: DocumentsUpload },
  { title: "Marital", component: MaritalStatus },
  { title: "Programs", component: IntendedPrograms },
  { title: "Review", component: ReviewSubmit },
];

const WizardForm: React.FC<WizardFormProps> = ({
  applicationId,
  onComplete,
}) => {
  const mode = applicationId ? 'edit' : 'create';
  const { completedSteps } = useAppSelector((state) => state.application);
  
  const [createApplication, { isLoading: isCreating, isSuccess, error }] =
    useCreateApplicationMutation();
  const [updateApplication, { isLoading: isUpdating }] =
    useUpdateApplicationMutation();

  const {
    methods,
    safeCurrentStep,
    handleNext,
    handleBack,
    formState,
  } = useApplicationForm(mode);

  const { isSubmitting, submitApplication, canSubmit } = useApplicationSubmission({
    mode,
    applicationId,
    onSubmitSuccess: (result) => {
      if (onComplete) {
        onComplete();
      }
    },
    onSubmitError: (error) => {
      logger.error('Submission error:', error);
    },
  });

  // Load application data if editing
  useEffect(() => {
    if (applicationId && mode === 'edit') {
      // Application data loading is handled in the edit page component
      logger.log("Loading application for edit:", applicationId);
    }
  }, [applicationId, mode]);

  const currentStepData = steps[safeCurrentStep];
  const isLoading = isCreating || isUpdating;
  // Show error if no step component found
  if (!currentStepData?.component) {
    logger.error(
      "No step component found for step:",
      safeCurrentStep,
      "Steps:",
      steps
    );
    return <ErrorView currentStep={safeCurrentStep} totalSteps={steps.length} />;
  }

  const CurrentStepComponent = currentStepData.component;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      await submitApplication(
        async (data) => {
          return await createApplication(data).unwrap();
        },
        async (data) => {
          return await updateApplication(data).unwrap();
        }
      );
    } catch (error) {
      // Error handling is done in useApplicationSubmission
      logger.error('Submit error:', error);
    }
  };

  if (isSuccess) {
    return (
      <SuccessView
        onComplete={onComplete}
        message={mode === 'edit' ? 'Application Updated Successfully!' : 'Application Submitted Successfully!'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
        <Stepper
          steps={steps}
          currentStep={safeCurrentStep}
          completedSteps={completedSteps}
        />

        <div className="bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
              <CurrentStepComponent />

              <NavigationButtons
                currentStep={safeCurrentStep}
                totalSteps={steps.length}
                onBack={handleBack}
                onNext={handleNext}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                isSubmitting={isSubmitting}
                error={error}
              />
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};

export default WizardForm;
