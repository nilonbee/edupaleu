import { Student, University } from '../types/applications';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';


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