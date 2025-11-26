import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Student {
    id: number;
    studentId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    email: string;
    phone?: string;
    nationality?: string;
    passportNumber?: string;
    displayPicture?: string;
    passportExpiry?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    hasEnglishTest: boolean;
    englishTestType?: 'IELTS' | 'TOEFL' | 'PTE' | 'DUOLINGO' | 'none';
    englishTestScore?: string;
    englishTestDate?: string;
}

export interface University {
    id: number;
    name: string;
    countryId: number;
    website?: string;
    ranking?: number;
    tuitionFeeRange?: string;
}


interface CreateApplicationRequest {
    student: any;
    universityId: number;
    academicQualifications: any[];
    documents: any[];
    maritalStatus: string;
    marriageCertificate?: any;
    intendedPrograms: any[];
}

export const applicationApi = createApi({
    reducerPath: 'applicationApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/v1/',
        prepareHeaders: (headers) => {
            headers.set('Content-Type', 'application/json');
            return headers;
        },
    }),
    tagTypes: ['Student', 'University', 'Application'],
    endpoints: (builder) => ({
        getStudents: builder.query<Student[], void>({
            query: () => 'students',
            providesTags: ['Student'],
        }),
        getStudent: builder.query<Student, void>({
            query: (id) => `students/${id}`,
            providesTags: ['Student'],
        }),
        getUniversities: builder.query<University[], void>({
            query: () => 'universities',
            providesTags: ['University'],
        }),
        createApplication: builder.mutation<any, CreateApplicationRequest>({
            query: (applicationData) => ({
                url: 'applications',
                method: 'POST',
                body: applicationData,
            }),
            invalidatesTags: ['Application'],
        }),
        uploadDocument: builder.mutation<any, FormData>({
            query: (formData) => ({
                url: 'documents/upload',
                method: 'POST',
                body: formData,
            }),
        }),
    }),
});

export const {
    useGetStudentsQuery,
    useGetStudentQuery,
    useGetUniversitiesQuery,
    useCreateApplicationMutation,
    useUploadDocumentMutation,
} = applicationApi;