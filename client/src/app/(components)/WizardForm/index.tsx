// components/WizardForm.tsx
"use client";
import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  setCurrentStep,
  completeStep,
  resetApplication,
} from "@/state/applicationSlice";
import { useCreateApplicationMutation } from "@/state/applicationApi";

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
  const dispatch = useAppDispatch();
  const {
    currentStep,
    completedSteps,
    student,
    selectedUniversity,
    academicQualifications,
    documents,
    maritalStatus,
    marriageCertificate,
    intendedPrograms,
  } = useAppSelector((state) => state.application);
  const [createApplication, { isLoading, isSuccess, error }] =
    useCreateApplicationMutation();

  const methods = useForm({
    mode: "onChange",
    shouldUnregister: false,
  });

  useEffect(() => {
    if (applicationId) {
      console.log("Loading application:", applicationId);
    }
  }, [applicationId]);

  useEffect(() => {
    const savedData = localStorage.getItem("applicationWizard");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.currentStep !== undefined) {
          const safeStep = Math.max(
            0,
            Math.min(parsedData.currentStep, steps.length - 1)
          );
          if (safeStep !== parsedData.currentStep) {
            console.warn(
              "Fixed invalid currentStep from localStorage:",
              parsedData.currentStep,
              "->",
              safeStep
            );
            dispatch(setCurrentStep(safeStep));
          }
        }
      } catch (err) {
        console.error("Error parsing localStorage data:", err);
        localStorage.removeItem("applicationWizard");
      }
    }
  }, [dispatch]);

  useEffect(() => {
    const state = {
      currentStep: Math.max(0, Math.min(currentStep, steps.length - 1)),
      student,
      selectedUniversity,
      academicQualifications,
      documents,
      maritalStatus,
      marriageCertificate,
      intendedPrograms,
      completedSteps,
    };
    localStorage.setItem("applicationWizard", JSON.stringify(state));
  }, [
    currentStep,
    student,
    selectedUniversity,
    academicQualifications,
    documents,
    maritalStatus,
    marriageCertificate,
    intendedPrograms,
    completedSteps,
  ]);

  const safeCurrentStep = Math.max(0, Math.min(currentStep, steps.length - 1));
  const currentStepData = steps[safeCurrentStep];
  useEffect(() => {
    if (currentStep !== safeCurrentStep) {
      console.warn(
        "Correcting currentStep from",
        currentStep,
        "to",
        safeCurrentStep
      );
      dispatch(setCurrentStep(safeCurrentStep));
    }
  }, [currentStep, safeCurrentStep, dispatch]);

  // Show error if no step component found
  if (!currentStepData?.component) {
    console.error(
      "No step component found for step:",
      safeCurrentStep,
      "Steps:",
      steps
    );
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Application Error
          </h2>
          <p className="text-gray-600 mb-4">
            There was a problem loading the application form.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Step {safeCurrentStep + 1} of {steps.length}
          </p>
          <button
            onClick={() => {
              dispatch(setCurrentStep(0));
              dispatch(resetApplication());
              localStorage.removeItem("applicationWizard");
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Restart Application
          </button>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = currentStepData.component;

  const handleNext = async () => {
    if (safeCurrentStep >= steps.length - 1) {
      return;
    }

    if (safeCurrentStep === 3 || safeCurrentStep === 6) {
      let isValid = true;
      let errorMessage = "";

      if (safeCurrentStep === 3 && academicQualifications.length === 0) {
        isValid = false;
        errorMessage =
          "Please add at least one academic qualification before proceeding.";
      }

      if (safeCurrentStep === 6 && intendedPrograms.length === 0) {
        isValid = false;
        errorMessage =
          "Please add at least one intended program before proceeding.";
      }

      if (!isValid) {
        alert(errorMessage);
        return;
      }

      dispatch(completeStep(safeCurrentStep));
      dispatch(setCurrentStep(safeCurrentStep + 1));
      return;
    }

    if (safeCurrentStep === 2) {
      const isValid = await methods.trigger();
      if (isValid && selectedUniversity) {
        dispatch(completeStep(safeCurrentStep));
        dispatch(setCurrentStep(safeCurrentStep + 1));
      } else {
        alert("Please select a university before proceeding.");
      }
      return;
    }

    const isValid = await methods.trigger();
    if (isValid) {
      dispatch(completeStep(safeCurrentStep));
      if (safeCurrentStep < steps.length - 1) {
        dispatch(setCurrentStep(safeCurrentStep + 1));
      }
    }
  };

  const handleBack = () => {
    if (safeCurrentStep > 0) {
      const prevStep = Math.max(safeCurrentStep - 1, 0);
      dispatch(setCurrentStep(prevStep));
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (!selectedUniversity) {
        alert("Please select a university before submitting.");
        return;
      }

      if (academicQualifications.length === 0) {
        alert("Please add at least one academic qualification.");
        return;
      }

      if (intendedPrograms.length === 0) {
        alert("Please add at least one intended program.");
        return;
      }

      const applicationData = {
        student: data,
        universityId: selectedUniversity,
        academicQualifications,
        documents,
        maritalStatus,
        marriageCertificate,
        intendedPrograms,
      };

      console.log("Submitting application:", applicationData);

      // Uncomment when API is ready
      // await createApplication(applicationData).unwrap();

      // Clear the form and storage after successful submission
      // dispatch(resetApplication());
      // localStorage.removeItem("applicationWizard");

      // Call onComplete callback if provided
      // if (onComplete) {
      //   onComplete();
      // }
    } catch (err) {
      console.error("Failed to submit application:", err);
      alert("Failed to submit application. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Application Submitted Successfully!
          </h2>
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
  }
  console.log(currentStep, "currentstep");
  console.log(steps.length, "length");
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Stepper Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="w-full">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.title}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                        index === safeCurrentStep
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
                        index === safeCurrentStep
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
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
              <CurrentStepComponent />

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={safeCurrentStep === 0}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Back
                </button>

                {safeCurrentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? "Submitting..." : "Submit Application"}
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">
                    Error submitting application. Please try again.
                  </p>
                </div>
              )}
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};

export default WizardForm;
