import { useEffect, useMemo, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import {
  setCurrentStep,
  completeStep,
  resetApplication,
  setStudent,
  setMaritalStatus,
  setMarriageCertificate,
  addAcademicQualification,
  addIntendedProgram,
  addDocument,
  loadApplicationData,
  setDestinationCountryId,
} from '@/state/applicationSlice';
import { Student } from '@/types/applications';
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
          if (parsedData.student) {
            dispatch(loadApplicationData({
              student: parsedData.student,
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
    // Step indices: 0=Details, 1=Academic, 2=Documents, 3=Marital, 4=Programs, 5=Review
    if (safeCurrentStep === 1 || safeCurrentStep === 4) {
      let isValid = true;
      let errorMessage = '';

      if (safeCurrentStep === 1 && academicQualifications.length === 0) {
        isValid = false;
        errorMessage = 'Please add at least one academic qualification before proceeding.';
      }

      if (safeCurrentStep === 4 && intendedPrograms.length === 0) {
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

    // Special validation for first step (student details)
    if (safeCurrentStep === 0) {
      const isValid = await methods.trigger();
      if (isValid) {
        // Get ALL form values explicitly - this ensures we capture auto-filled values too
        // List all possible field names to ensure they're all captured
        const allFields = [
          'firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone', 'secondPhone',
          'nationality', 'passportNumber', 'passportExpiry', 'address', 'city',
          'state', 'zipCode', 'studentId', 'hasEnglishTest', 'englishTestType',
          'englishTestScore', 'englishTestDate', 'emergencyContactName', 'emergencyContactPhone',
          'destinationCountryId'
        ];

        // Get all values at once - this captures all fields regardless of touch state
        const formValues = methods.getValues();

        // Also read directly from DOM to capture browser auto-filled values
        // This is necessary because React Hook Form might not detect auto-filled values
        const fieldValues: Record<string, any> = {};
        allFields.forEach(field => {
          // Try to get from DOM first (for auto-filled values)
          const formElement = document.querySelector(`[name="${field}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
          const domValue = formElement?.value;

          // Get from React Hook Form
          const rhfValue = methods.getValues(field);

          // Use DOM value if it exists and is different from RHF value (likely auto-filled)
          // Otherwise use RHF value, fallback to formValues
          if (domValue !== undefined && domValue !== '' && domValue !== rhfValue) {
            fieldValues[field] = domValue;
          } else {
            fieldValues[field] = rhfValue !== undefined ? rhfValue : formValues[field];
          }
        });

        logger.log('Form values (all fields):', fieldValues);
        logger.log('DOM values captured:', allFields.map(f => {
          const el = document.querySelector(`[name="${f}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
          return { field: f, value: el?.value };
        }));
        logger.log('Original form values:', formValues);

        // Save destinationCountryId to Redux if present
        const countryId = fieldValues.destinationCountryId || formValues.destinationCountryId;
        if (countryId) {
          dispatch(setDestinationCountryId(parseInt(countryId, 10)));
        }

        // Build student object with all form fields
        // Use fieldValues first, fallback to formValues, then to existing student data
        const updatedStudent: Student = {
          id: student?.id ?? 0,
          studentId: fieldValues.studentId || formValues.studentId || student?.studentId || '',
          firstName: fieldValues.firstName || formValues.firstName || student?.firstName || '',
          lastName: fieldValues.lastName || formValues.lastName || student?.lastName || '',
          dateOfBirth: fieldValues.dateOfBirth || formValues.dateOfBirth || student?.dateOfBirth || '',
          gender: (fieldValues.gender || formValues.gender || student?.gender || 'MALE') as 'MALE' | 'FEMALE' | 'OTHER',
          email: fieldValues.email || formValues.email || student?.email || '',
          hasEnglishTest: fieldValues.hasEnglishTest ?? formValues.hasEnglishTest ?? student?.hasEnglishTest ?? false,
          // Optional fields - use fieldValues if available, otherwise formValues, otherwise existing, otherwise undefined
          phone: fieldValues.phone !== undefined && fieldValues.phone !== '' ? fieldValues.phone :
            (formValues.phone !== undefined && formValues.phone !== '' ? formValues.phone :
              (student?.phone !== undefined && student.phone !== '' ? student.phone : undefined)),
          secondPhone: fieldValues.secondPhone !== undefined && fieldValues.secondPhone !== '' ? fieldValues.secondPhone :
            (formValues.secondPhone !== undefined && formValues.secondPhone !== '' ? formValues.secondPhone :
              (student?.secondPhone !== undefined && student.secondPhone !== '' ? student.secondPhone : undefined)),
          nationality: fieldValues.nationality !== undefined && fieldValues.nationality !== '' ? fieldValues.nationality :
            (formValues.nationality !== undefined && formValues.nationality !== '' ? formValues.nationality :
              (student?.nationality !== undefined && student.nationality !== '' ? student.nationality : undefined)),
          passportNumber: fieldValues.passportNumber !== undefined && fieldValues.passportNumber !== '' ? fieldValues.passportNumber :
            (formValues.passportNumber !== undefined && formValues.passportNumber !== '' ? formValues.passportNumber :
              (student?.passportNumber !== undefined && student.passportNumber !== '' ? student.passportNumber : undefined)),
          passportExpiry: fieldValues.passportExpiry !== undefined && fieldValues.passportExpiry !== '' ? fieldValues.passportExpiry :
            (formValues.passportExpiry !== undefined && formValues.passportExpiry !== '' ? formValues.passportExpiry :
              (student?.passportExpiry !== undefined && student.passportExpiry !== '' ? student.passportExpiry : undefined)),
          address: fieldValues.address !== undefined && fieldValues.address !== '' ? fieldValues.address :
            (formValues.address !== undefined && formValues.address !== '' ? formValues.address :
              (student?.address !== undefined && student.address !== '' ? student.address : undefined)),
          city: fieldValues.city !== undefined && fieldValues.city !== '' ? fieldValues.city :
            (formValues.city !== undefined && formValues.city !== '' ? formValues.city :
              (student?.city !== undefined && student.city !== '' ? student.city : undefined)),
          state: fieldValues.state !== undefined && fieldValues.state !== '' ? fieldValues.state :
            (formValues.state !== undefined && formValues.state !== '' ? formValues.state :
              (student?.state !== undefined && student.state !== '' ? student.state : undefined)),
          zipCode: fieldValues.zipCode !== undefined && fieldValues.zipCode !== '' ? fieldValues.zipCode :
            (formValues.zipCode !== undefined && formValues.zipCode !== '' ? formValues.zipCode :
              (student?.zipCode !== undefined && student.zipCode !== '' ? student.zipCode : undefined)),
          englishTestType: fieldValues.englishTestType !== undefined && fieldValues.englishTestType !== 'none' ? fieldValues.englishTestType :
            (formValues.englishTestType !== undefined && formValues.englishTestType !== 'none' ? formValues.englishTestType :
              (student?.englishTestType !== undefined && student.englishTestType !== 'none' ? student.englishTestType : undefined)),
          englishTestScore: fieldValues.englishTestScore !== undefined && fieldValues.englishTestScore !== '' ? fieldValues.englishTestScore :
            (formValues.englishTestScore !== undefined && formValues.englishTestScore !== '' ? formValues.englishTestScore :
              (student?.englishTestScore !== undefined && student.englishTestScore !== '' ? student.englishTestScore : undefined)),
          englishTestDate: fieldValues.englishTestDate !== undefined && fieldValues.englishTestDate !== '' ? fieldValues.englishTestDate :
            (formValues.englishTestDate !== undefined && formValues.englishTestDate !== '' ? formValues.englishTestDate :
              (student?.englishTestDate !== undefined && student.englishTestDate !== '' ? student.englishTestDate : undefined)),
          displayPicture: student?.displayPicture,
        };

        logger.log('Saving student data to Redux:', updatedStudent);

        // Save student data to Redux
        dispatch(setStudent(updatedStudent));

        dispatch(completeStep(safeCurrentStep));
        dispatch(setCurrentStep(safeCurrentStep + 1));
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
      academicQualifications,
      documents,
      maritalStatus,
      marriageCertificate,
      intendedPrograms,
      completedSteps,
    },
  };
};

