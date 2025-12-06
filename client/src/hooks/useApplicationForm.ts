import { useEffect, useMemo, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import {
  setCurrentStep,
  completeStep,
  resetApplication,
  setStudent,
  setSelectedUniversity,
  setMaritalStatus,
  setMarriageCertificate,
  addAcademicQualification,
  addIntendedProgram,
  addDocument,
  loadApplicationData,
} from '@/state/applicationSlice';
import { showToast } from '@/utils/toast';
import { logger } from '@/utils/logger';
import { APPLICATION_CONSTANTS } from '@/utils/constants';

const TOTAL_STEPS = APPLICATION_CONSTANTS.TOTAL_STEPS;

export const useApplicationForm = (mode: 'create' | 'edit' = 'create') => {
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

  const methods = useForm({
    mode: 'onChange',
    shouldUnregister: false,
  });

  // Calculate safe current step
  const safeCurrentStep = useMemo(
    () => Math.max(0, Math.min(currentStep, TOTAL_STEPS - 1)),
    [currentStep]
  );

  // Track if we've restored from localStorage to avoid re-restoring
  const hasRestoredRef = useRef(false);

  // Restore from localStorage on mount (create mode only)
  useEffect(() => {
    if (mode === 'create' && !hasRestoredRef.current) {
      const savedData = localStorage.getItem(APPLICATION_CONSTANTS.STORAGE_KEYS.APPLICATION_WIZARD);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          
          // If we have complete application data, use loadApplicationData
          if (parsedData.student && parsedData.selectedUniversity) {
            dispatch(loadApplicationData({
              student: parsedData.student,
              university: parsedData.selectedUniversity,
              academicQualifications: parsedData.academicQualifications || [],
              documents: parsedData.documents || [],
              maritalStatus: parsedData.maritalStatus || 'SINGLE',
              marriageCertificate: parsedData.marriageCertificate,
              intendedPrograms: parsedData.intendedPrograms || [],
            }));
            
            // Restore current step
            if (parsedData.currentStep !== undefined) {
              const safeStep = Math.max(0, Math.min(parsedData.currentStep, TOTAL_STEPS - 1));
              dispatch(setCurrentStep(safeStep));
            }
            
            logger.log('Restored application data from localStorage');
          } else {
            // Partial restore - restore what we have
            if (parsedData.currentStep !== undefined) {
              const safeStep = Math.max(0, Math.min(parsedData.currentStep, TOTAL_STEPS - 1));
              dispatch(setCurrentStep(safeStep));
            }
            if (parsedData.student) dispatch(setStudent(parsedData.student));
            if (parsedData.selectedUniversity) dispatch(setSelectedUniversity(parsedData.selectedUniversity));
            if (parsedData.maritalStatus) dispatch(setMaritalStatus(parsedData.maritalStatus));
            if (parsedData.marriageCertificate) dispatch(setMarriageCertificate(parsedData.marriageCertificate));
            
            // Restore arrays
            if (parsedData.academicQualifications) {
              parsedData.academicQualifications.forEach((qual: any) => {
                dispatch(addAcademicQualification(qual));
              });
            }
            if (parsedData.documents) {
              parsedData.documents.forEach((doc: any) => {
                dispatch(addDocument(doc));
              });
            }
            if (parsedData.intendedPrograms) {
              parsedData.intendedPrograms.forEach((prog: any) => {
                dispatch(addIntendedProgram(prog));
              });
            }
            if (parsedData.completedSteps) {
              parsedData.completedSteps.forEach((step: number) => {
                dispatch(completeStep(step));
              });
            }
          }
          
          hasRestoredRef.current = true;
        } catch (err) {
          logger.error('Error parsing localStorage data:', err);
          localStorage.removeItem(APPLICATION_CONSTANTS.STORAGE_KEYS.APPLICATION_WIZARD);
        }
      } else {
        hasRestoredRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, mode]); // Only run on mount

  // Save to localStorage
  useEffect(() => {
    if (mode === 'create') {
      const state = {
        currentStep: safeCurrentStep,
        student,
        selectedUniversity,
        academicQualifications,
        documents,
        maritalStatus,
        marriageCertificate,
        intendedPrograms,
        completedSteps,
      };
      localStorage.setItem(APPLICATION_CONSTANTS.STORAGE_KEYS.APPLICATION_WIZARD, JSON.stringify(state));
    }
  }, [
    safeCurrentStep,
    student,
    selectedUniversity,
    academicQualifications,
    documents,
    maritalStatus,
    marriageCertificate,
    intendedPrograms,
    completedSteps,
    mode,
  ]);

  // Correct invalid step
  useEffect(() => {
    if (currentStep !== safeCurrentStep) {
      logger.warn('Correcting currentStep from', currentStep, 'to', safeCurrentStep);
      dispatch(setCurrentStep(safeCurrentStep));
    }
  }, [currentStep, safeCurrentStep, dispatch]);

  const handleNext = async () => {
    if (safeCurrentStep >= TOTAL_STEPS - 1) return;

    // Special validation for steps that require at least one item
    if (safeCurrentStep === 3 || safeCurrentStep === 6) {
      let isValid = true;
      let errorMessage = '';

      if (safeCurrentStep === 3 && academicQualifications.length === 0) {
        isValid = false;
        errorMessage = 'Please add at least one academic qualification before proceeding.';
      }

      if (safeCurrentStep === 6 && intendedPrograms.length === 0) {
        isValid = false;
        errorMessage = 'Please add at least one intended program before proceeding.';
      }

      if (!isValid) {
        showToast.error(errorMessage);
        return;
      }

      dispatch(completeStep(safeCurrentStep));
      dispatch(setCurrentStep(safeCurrentStep + 1));
      return;
    }

    // Special validation for university selection
    if (safeCurrentStep === 2) {
      const isValid = await methods.trigger();
      if (isValid && selectedUniversity) {
        dispatch(completeStep(safeCurrentStep));
        dispatch(setCurrentStep(safeCurrentStep + 1));
      } else {
        showToast.error('Please select a university before proceeding.');
      }
      return;
    }

    // Default validation
    const isValid = await methods.trigger();
    if (isValid) {
      dispatch(completeStep(safeCurrentStep));
      if (safeCurrentStep < TOTAL_STEPS - 1) {
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

  const resetForm = () => {
    dispatch(resetApplication());
    if (mode === 'create') {
      localStorage.removeItem(APPLICATION_CONSTANTS.STORAGE_KEYS.APPLICATION_WIZARD);
    }
  };

  return {
    methods,
    safeCurrentStep,
    handleNext,
    handleBack,
    resetForm,
    formState: {
      student,
      selectedUniversity,
      academicQualifications,
      documents,
      maritalStatus,
      marriageCertificate,
      intendedPrograms,
      completedSteps,
    },
  };
};

