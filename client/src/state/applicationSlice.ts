// store/slices/applicationSlice.ts
import { AcademicQualification, ApplicationDocument, IntendedProgram, Student, University } from '@/types/applications';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ApplicationState {
    currentStep: number;
    student: Student | null;
    selectedUniversity: number | null;
    academicQualifications: AcademicQualification[];
    documents: ApplicationDocument[];
    maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
    marriageCertificate?: ApplicationDocument;
    intendedPrograms: IntendedProgram[];
    completedSteps: number[];
}

const initialState: ApplicationState = {
    currentStep: 0,
    student: null,
    selectedUniversity: null,
    academicQualifications: [],
    documents: [],
    maritalStatus: 'SINGLE',
    intendedPrograms: [],
    completedSteps: [],
};

const applicationSlice = createSlice({
    name: 'application',
    initialState,
    reducers: {
        setCurrentStep: (state, action: PayloadAction<number>) => {
            state.currentStep = action.payload;
        },
        setStudent: (state, action: PayloadAction<Student | null>) => {
            state.student = action.payload;
        },
        setSelectedUniversity: (state, action: PayloadAction<number>) => {
            state.selectedUniversity = action.payload;
        },
        addAcademicQualification: (state, action: PayloadAction<AcademicQualification>) => {
            state.academicQualifications.push(action.payload);
        },
        updateAcademicQualification: (state, action: PayloadAction<{ index: number; qualification: AcademicQualification }>) => {
            state.academicQualifications[action.payload.index] = action.payload.qualification;
        },
        removeAcademicQualification: (state, action: PayloadAction<number>) => {
            state.academicQualifications.splice(action.payload, 1);
        },
        addDocument: (state, action: PayloadAction<ApplicationDocument>) => {
            state.documents.push(action.payload);
        },
        setMaritalStatus: (state, action: PayloadAction<ApplicationState['maritalStatus']>) => {
            state.maritalStatus = action.payload;
        },
        setMarriageCertificate: (state, action: PayloadAction<ApplicationDocument | undefined>) => {
            state.marriageCertificate = action.payload;
        },
        addIntendedProgram: (state, action: PayloadAction<IntendedProgram>) => {
            state.intendedPrograms.push(action.payload);
        },
        updateIntendedProgram: (state, action: PayloadAction<{ index: number; program: IntendedProgram }>) => {
            state.intendedPrograms[action.payload.index] = action.payload.program;
        },
        removeIntendedProgram: (state, action: PayloadAction<number>) => {
            state.intendedPrograms.splice(action.payload, 1);
        },
        completeStep: (state, action: PayloadAction<number>) => {
            if (!state.completedSteps.includes(action.payload)) {
                state.completedSteps.push(action.payload);
            }
        },
        resetApplication: () => initialState,
    },
});

export const {
    setCurrentStep,
    setStudent,
    setSelectedUniversity,
    addAcademicQualification,
    updateAcademicQualification,
    removeAcademicQualification,
    addDocument,
    setMaritalStatus,
    setMarriageCertificate,
    addIntendedProgram,
    updateIntendedProgram,
    removeIntendedProgram,
    completeStep,
    resetApplication,
} = applicationSlice.actions;

export default applicationSlice.reducer;