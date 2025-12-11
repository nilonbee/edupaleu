
// store/slices/applicationSlice.ts
import { AcademicQualification, ApplicationDocument, IntendedProgram, Student, University } from '@/types/applications';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logger } from '@/utils/logger';

// Simple extension for local file storage
interface LocalApplicationDocument extends ApplicationDocument {
    fileId?: string; // Reference to file in sessionStorage
    fileSize?: number;
    fileType?: string;
    url?: string; // S3 URL for the document
}

interface ApplicationState {
    currentStep: number;
    student: Student | null | undefined;
    selectedUniversity: University | undefined | null;
    academicQualifications: AcademicQualification[];
    documents: LocalApplicationDocument[];
    maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
    marriageCertificate?: LocalApplicationDocument;
    intendedPrograms: IntendedProgram[];
    completedSteps: number[];
    fromEnquiry?: boolean; // Track if application is being created from an enquiry
    enquiryId?: number; // Store enquiry ID if applicable
    destinationCountryId?: number; // Store destination country ID
}

const initialState: ApplicationState = {
    currentStep: 0,
    student: undefined,
    selectedUniversity: undefined,
    academicQualifications: [],
    documents: [],
    maritalStatus: 'SINGLE',
    marriageCertificate: undefined,
    intendedPrograms: [],
    completedSteps: [],
    fromEnquiry: false,
    enquiryId: undefined,
    destinationCountryId: undefined,
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
        setSelectedUniversity: (state, action: PayloadAction<University>) => {
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

        // MODIFY addDocument to handle sessionStorage cleanup
        addDocument: (state, action: PayloadAction<LocalApplicationDocument>) => {
            const newDocument = action.payload;

            // Find existing document of same type
            const existingIndex = state.documents.findIndex(
                doc => doc.documentType === newDocument.documentType
            );

            if (existingIndex !== -1) {
                // Clean up old file from sessionStorage
                const oldDoc = state.documents[existingIndex];
                if (oldDoc.fileId) {
                    try {
                        sessionStorage.removeItem(oldDoc.fileId);
                    } catch (error) {
                        logger.warn('Failed to remove old file from sessionStorage:', error);
                    }
                }
                // Remove the old document
                state.documents.splice(existingIndex, 1);
            }

            // Add the new document
            state.documents.push(newDocument);
        },

        // MODIFY removeDocument to clean up sessionStorage
        removeDocument: (state, action: PayloadAction<string>) => {
            const documentType = action.payload;
            const docIndex = state.documents.findIndex(doc => doc.documentType === documentType);

            if (docIndex !== -1) {
                const doc = state.documents[docIndex];
                // Clean up file from sessionStorage
                if (doc.fileId) {
                    try {
                        sessionStorage.removeItem(doc.fileId);
                    } catch (error) {
                        logger.warn('Failed to remove file from sessionStorage:', error);
                    }
                }
                // Remove from state
                state.documents.splice(docIndex, 1);
            }
        },

        // MODIFY setMarriageCertificate to handle sessionStorage
        setMarriageCertificate: (state, action: PayloadAction<LocalApplicationDocument | undefined>) => {
            // Clean up old file from sessionStorage if exists
            if (state.marriageCertificate?.fileId) {
                try {
                    sessionStorage.removeItem(state.marriageCertificate.fileId);
                } catch (error) {
                    logger.warn('Failed to remove old marriage certificate from sessionStorage:', error);
                }
            }

            state.marriageCertificate = action.payload;
        },

        // MODIFY resetApplication to clean up all sessionStorage
        resetApplication: (state) => {
            // Clean up all document files from sessionStorage
            state.documents.forEach(doc => {
                if (doc.fileId) {
                    try {
                        sessionStorage.removeItem(doc.fileId);
                    } catch (error) {
                        logger.warn('Failed to remove file from sessionStorage:', error);
                    }
                }
            });

            // Clean up marriage certificate file
            if (state.marriageCertificate?.fileId) {
                try {
                    sessionStorage.removeItem(state.marriageCertificate.fileId);
                } catch (error) {
                    logger.warn('Failed to remove marriage certificate from sessionStorage:', error);
                }
            }

            // Return fresh initialState
            return initialState;
        },

        setFromEnquiry: (state, action: PayloadAction<{ fromEnquiry: boolean; enquiryId?: number }>) => {
            state.fromEnquiry = action.payload.fromEnquiry;
            state.enquiryId = action.payload.enquiryId;
        },

        // In your applicationSlice.ts
        setDocumentS3Url: (state, action: PayloadAction<{ documentType: string; s3Url: string }>) => {
            const { documentType, s3Url } = action.payload;

            // Update in documents array
            const docIndex = state.documents.findIndex(doc => doc.documentType === documentType);
            if (docIndex !== -1) {
                state.documents[docIndex].url = s3Url;
            }

            // Update in marriageCertificate if applicable
            if (state.marriageCertificate?.documentType === documentType) {
                state.marriageCertificate.url = s3Url;
            }
        },

        setMaritalStatus: (state, action: PayloadAction<ApplicationState['maritalStatus']>) => {
            state.maritalStatus = action.payload;
        },

        addIntendedProgram: (state, action: PayloadAction<IntendedProgram>) => {
            state.intendedPrograms.push(action.payload);
        },

        updateIntendedProgram: (state, action: PayloadAction<{ index: number; program: IntendedProgram }>) => {
            state.intendedPrograms[action.payload.index] = action.payload.program;
        },

        removeIntendedProgram: (state, action: PayloadAction<number>) => {
            state.intendedPrograms.splice(action.payload, 1);
            // Recalculate priorities after removal
            state.intendedPrograms.forEach((program, index) => {
                program.priority = index + 1;
            });
        },

        reorderIntendedPrograms: (state, action: PayloadAction<{ oldIndex: number; newIndex: number }>) => {
            const { oldIndex, newIndex } = action.payload;
            const programs = [...state.intendedPrograms];
            const [movedProgram] = programs.splice(oldIndex, 1);
            programs.splice(newIndex, 0, movedProgram);

            // Recalculate priorities based on new order
            state.intendedPrograms = programs.map((program, index) => ({
                ...program,
                priority: index + 1,
            }));
        },

        completeStep: (state, action: PayloadAction<number>) => {
            if (!state.completedSteps.includes(action.payload)) {
                state.completedSteps.push(action.payload);
            }
        },

        loadApplicationData: (state, action: PayloadAction<{
            student: Student;
            university?: University;
            academicQualifications?: AcademicQualification[];
            documents?: LocalApplicationDocument[];
            maritalStatus?: ApplicationState['maritalStatus'];
            marriageCertificate?: LocalApplicationDocument;
            intendedPrograms?: IntendedProgram[];
            fromEnquiry?: boolean;
            enquiryId?: number;
            destinationCountryId?: number;
        }>) => {
            state.student = action.payload.student;
            if (action.payload.university) state.selectedUniversity = action.payload.university;
            if (action.payload.academicQualifications) state.academicQualifications = action.payload.academicQualifications;
            if (action.payload.documents) state.documents = action.payload.documents;
            if (action.payload.maritalStatus) state.maritalStatus = action.payload.maritalStatus;
            if (action.payload.marriageCertificate !== undefined) state.marriageCertificate = action.payload.marriageCertificate;
            if (action.payload.intendedPrograms) state.intendedPrograms = action.payload.intendedPrograms;
            if (action.payload.fromEnquiry !== undefined) state.fromEnquiry = action.payload.fromEnquiry;
            if (action.payload.enquiryId !== undefined) state.enquiryId = action.payload.enquiryId;
            if (action.payload.destinationCountryId !== undefined) state.destinationCountryId = action.payload.destinationCountryId;
            if (action.payload.university) {
                state.completedSteps = Array.from({ length: 8 }, (_, i) => i);
            }
        },
        setDestinationCountryId: (state, action: PayloadAction<number>) => {
            state.destinationCountryId = action.payload;
        },

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
    removeDocument,
    setMaritalStatus,
    setMarriageCertificate,
    addIntendedProgram,
    updateIntendedProgram,
    removeIntendedProgram,
    reorderIntendedPrograms,
    completeStep,
    resetApplication,
    setDocumentS3Url,
    loadApplicationData,
    setFromEnquiry,
    setDestinationCountryId,
} = applicationSlice.actions;

// Selectors
export const selectDocuments = (state: { application: ApplicationState }) =>
    state.application.documents || [];

export const selectDocumentByType = (documentType: string) => (state: { application: ApplicationState }) =>
    (state.application.documents || []).find(doc => doc.documentType === documentType);

export const selectAcademicQualifications = (state: { application: ApplicationState }) =>
    state.application.academicQualifications || [];

export default applicationSlice.reducer;