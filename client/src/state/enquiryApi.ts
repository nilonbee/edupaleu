import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

export interface Enquiry {
    id: number;
    firstName: string;
    lastName?: string;
    email?: string;
    phone: string;
    cvDocument?: string;
    firstFollowUpRemarks?: string;
    secondFollowUpRemarks?: string;
    thirdFollowUpRemarks?: string;
    remarks?: string;
    createdBy?: string;
    assignedToId?: number;
    countryId?: number;
    createdAt: string;
    updatedAt: string;
    assignedTo?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    country?: {
        id: number;
        name: string;
        code: string;
    };
    applications?: Array<{
        id: number;
        applicationRef: string;
        intendedProgram: string;
        applicationStatus?: {
            status: string;
        };
    }>;
}

export interface EnquiriesResponse {
    success: boolean;
    data: Enquiry[];
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    };
}

export interface EnquiryQueryParams {
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    order?: 'asc' | 'desc';
    assignedTo?: number;
    countryId?: number;
}

export interface CreateEnquiryRequest {
    firstName: string;
    lastName?: string;
    email?: string;
    phone: string;
    cvDocument?: string;
    firstFollowUpRemarks?: string;
    secondFollowUpRemarks?: string;
    thirdFollowUpRemarks?: string;
    remarks?: string;
    assignedToId?: number;
    countryId: number;
}

export interface UpdateEnquiryRequest {
    id: number;
    firstName: string;
    lastName?: string;
    email?: string;
    phone: string;
    cvDocument?: string;
    firstFollowUpRemarks?: string;
    secondFollowUpRemarks?: string;
    thirdFollowUpRemarks?: string;
    remarks?: string;
    assignedToId?: number;
    countryId?: number;
}

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    const baseResult = await fetchBaseQuery({
        baseUrl: '/api/v1/',
        credentials: 'include',
    })(args, api, extraOptions);

    // Handle 401 Unauthorized
    if (baseResult.error && 'status' in baseResult.error && baseResult.error.status === 401) {
        const { clearUser } = await import('./authSlice');
        api.dispatch(clearUser());
    }

    return baseResult;
};

export const enquiryApi = createApi({
    reducerPath: 'enquiryApi',
    baseQuery,
    tagTypes: ['Enquiry'],
    endpoints: (builder) => ({
        getAllEnquiries: builder.query<EnquiriesResponse, EnquiryQueryParams | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params) {
                    Object.entries(params).forEach(([key, value]) => {
                        if (value !== undefined) {
                            searchParams.append(key, String(value));
                        }
                    });
                }
                return {
                    url: `enquiries${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
                };
            },
            providesTags: (result) =>
                result
                    ? [...result.data.map(({ id }) => ({ type: 'Enquiry' as const, id })), 'Enquiry']
                    : ['Enquiry'],
        }),
        getSingleEnquiry: builder.query<{ success: boolean; data: Enquiry }, number>({
            query: (id) => `enquiries/${id}`,
            providesTags: (result, error, id) => [{ type: 'Enquiry', id }],
        }),
        createEnquiry: builder.mutation<{ success: boolean; message: string; data: Enquiry }, CreateEnquiryRequest>({
            query: (enquiryData) => ({
                url: 'enquiries',
                method: 'POST',
                body: enquiryData,
            }),
            invalidatesTags: ['Enquiry'],
        }),
        updateEnquiry: builder.mutation<{ success: boolean; message: string; data: Enquiry }, UpdateEnquiryRequest>({
            query: ({ id, ...patch }) => ({
                url: `enquiries/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: (result, error, { id }) => ['Enquiry', { type: 'Enquiry', id }],
        }),
        deleteEnquiry: builder.mutation<{ success: boolean; message: string }, number>({
            query: (id) => ({
                url: `enquiries/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => ['Enquiry', { type: 'Enquiry', id }],
        }),
        getCountries: builder.query<{ success: boolean; data: Array<{ id: number; name: string; code: string }> }, void>({
            query: () => 'countries',
            providesTags: ['Enquiry'],
        }),
    }),
});

export const {
    useGetAllEnquiriesQuery,
    useGetSingleEnquiryQuery,
    useCreateEnquiryMutation,
    useUpdateEnquiryMutation,
    useDeleteEnquiryMutation,
    useGetCountriesQuery,
} = enquiryApi;

