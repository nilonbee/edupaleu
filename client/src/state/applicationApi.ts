import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { CreateApplicationRequest, UpdateApplicationRequest, AcademicQualification, University } from '@/types/applications';

export interface Student {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    email: string;
    phone?: string;
    secondPhone?: string;
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

// Re-export University from types to use as the single source of truth
export type { University };
import { Application } from './api';

// Query parameters for getApplications
export interface GetApplicationsParams {
    search?: string;
    status?: string | string[];
    countryId?: number;
    sort_by?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

// Response type for paginated applications
export interface ApplicationsResponse {
    success: boolean;
    data: Application[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

// Status update request/response
export interface UpdateStatusRequest {
    applicationId: number;
    status: string;
}

export interface UpdateStatusResponse {
    success: boolean;
    message: string;
    data: {
        id: number;
        applicationRef: string;
        status: {
            id: number;
            status: string;
            description?: string;
        };
    };
}

// API Response type that matches what backend actually returns
export interface ApplicationResponseData {
    applicationId: number;
    applicationRef: string;
    student: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    university: {
        id: number;
        name: string;
        website?: string;
        ranking?: number;
        countryId?: number;
        country?: {
            id: number;
            name: string;
            code?: string;
        };
    };
    academicQualifications: AcademicQualification[];
    documents: Array<{
        id: number;
        documentType: string;
        fileName: string;
        filePath: string;
        fileSize?: number;
        uploadedAt?: string;
    }>;
    intendedPrograms: Array<{
        id?: number;
        country: string;
        university: string;
        programme: string;
        priority?: number;
        isPrimary?: boolean;
    }>;
    applicationStatus?: {
        id: number;
        status: string;
        description?: string;
    };
    submissionDate?: string;
}

// Custom baseQuery that handles FormData correctly and 401 errors
const baseQueryWithoutAuth = fetchBaseQuery({
    baseUrl: '/api/v1/',
    credentials: 'include', // Include cookies for authentication
    prepareHeaders: (headers, { endpoint }) => {
        // Don't set Content-Type for FormData uploads - browser will set it with boundary
        if (endpoint !== 'uploadDocument') {
            headers.set('Content-Type', 'application/json');
        }
        // For FormData, let browser set Content-Type automatically
        return headers;
    },
});

const baseQueryWithFormData: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    const result = await baseQueryWithoutAuth(args, api, extraOptions);

    // Handle 401 Unauthorized - clear auth state
    if (result.error && 'status' in result.error && result.error.status === 401) {
        const { clearUser } = await import('./authSlice');
        api.dispatch(clearUser());
        // Note: API state reset should be handled at the store level if needed
        // api.util is not available in baseQuery callback
    }

    return result;
};

export const applicationApi = createApi({
    reducerPath: 'applicationApi',
    baseQuery: baseQueryWithFormData,
    tagTypes: ['Student', 'University', 'Application'],
    endpoints: (builder) => ({
        getStudents: builder.query<Student[], void>({
            query: () => 'students',
            providesTags: ['Student'],
        }),
        getStudent: builder.query<Student, number>({
            query: (id) => `students/${id}`,
            providesTags: ['Student'],
        }),
        getUniversities: builder.query<University[], void>({
            query: () => 'universities',
            providesTags: ['University'],
        }),
        getApplications: builder.query<ApplicationsResponse | Application[], GetApplicationsParams | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                const queryParams = params || {};

                if (queryParams.search) searchParams.append('search', queryParams.search);
                if (queryParams.status) {
                    const statusArray = Array.isArray(queryParams.status) ? queryParams.status : [queryParams.status];
                    searchParams.append('status', statusArray.join(','));
                }
                if (queryParams.countryId !== undefined && queryParams.countryId !== null) {
                    searchParams.append('countryId', queryParams.countryId.toString());
                }
                if (queryParams.sort_by) searchParams.append('sort_by', queryParams.sort_by);
                if (queryParams.order) searchParams.append('order', queryParams.order);
                if (queryParams.page) searchParams.append('page', queryParams.page.toString());
                if (queryParams.limit) searchParams.append('limit', queryParams.limit.toString());

                const queryString = searchParams.toString();
                return `applications${queryString ? `?${queryString}` : ''}`;
            },
            providesTags: ['Application'],
        }),
        getApplication: builder.query<{ success: boolean; data: ApplicationResponseData }, number>({
            query: (id) => `applications/${id}`,
            providesTags: (result, error, id) => [{ type: 'Application', id }],
        }),
        createApplication: builder.mutation<any, CreateApplicationRequest>({
            query: (applicationData) => ({
                url: 'applications',
                method: 'POST',
                body: applicationData,
            }),
            invalidatesTags: ['Application'],
        }),
        updateApplication: builder.mutation<any, UpdateApplicationRequest>({
            query: (applicationData) => ({
                url: `applications/${applicationData.applicationId}`,
                method: 'PUT',
                body: applicationData,
            }),
            invalidatesTags: (result, error, { applicationId }) => [
                { type: 'Application', id: applicationId },
                'Application',
            ],
        }),
        deleteApplication: builder.mutation<void, number>({
            query: (id) => ({
                url: `applications/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Application'],
        }),
        updateApplicationStatus: builder.mutation<UpdateStatusResponse, UpdateStatusRequest>({
            query: ({ applicationId, status }) => ({
                url: `applications/${applicationId}/status`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: (result, error, { applicationId }) => [
                { type: 'Application', id: applicationId },
                'Application',
            ],
        }),
        updateApplicationAssignedTo: builder.mutation<
            { success: boolean; message: string; data: Application },
            { applicationId: number; assignedToId: number | null }
        >({
            query: ({ applicationId, assignedToId }) => ({
                url: `applications/${applicationId}/assigned-to`,
                method: 'PATCH',
                body: { assignedToId },
            }),
            invalidatesTags: (result, error, { applicationId }) => [
                { type: 'Application', id: applicationId },
                'Application',
            ],
        }),
        updateApplicationAssignedAgent: builder.mutation<
            { success: boolean; message: string; data: Application },
            { applicationId: number; assignedAgentId: number | null }
        >({
            query: ({ applicationId, assignedAgentId }) => ({
                url: `applications/${applicationId}/assigned-agent`,
                method: 'PATCH',
                body: { assignedAgentId },
            }),
            invalidatesTags: (result, error, { applicationId }) => [
                { type: 'Application', id: applicationId },
                'Application',
            ],
        }),
        updateApplicationRegistered: builder.mutation<
            { success: boolean; message: string; data: Application },
            { applicationId: number; registered: boolean }
        >({
            query: ({ applicationId, registered }) => ({
                url: `applications/${applicationId}/registered`,
                method: 'PATCH',
                body: { registered },
            }),
            invalidatesTags: (result, error, { applicationId }) => [
                { type: 'Application', id: applicationId },
                'Application',
            ],
        }),
        uploadDocument: builder.mutation<any, FormData>({
            query: (formData) => ({
                url: 'file-upload/batch',
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
    useGetApplicationsQuery,
    useGetApplicationQuery,
    useCreateApplicationMutation,
    useUpdateApplicationMutation,
    useDeleteApplicationMutation,
    useUpdateApplicationStatusMutation,
    useUpdateApplicationAssignedToMutation,
    useUpdateApplicationAssignedAgentMutation,
    useUpdateApplicationRegisteredMutation,
    useUploadDocumentMutation,
} = applicationApi;