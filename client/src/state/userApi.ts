import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    isActive: boolean;
    displayPicture?: string;
    lastLogin?: string;
    createdAt: string;
    mustChangePassword?: boolean;
}

export interface UsersResponse {
    success: boolean;
    data: User[];
    count: number;
}

export interface SingleUserResponse {
    success: boolean;
    data: User;
}

export interface CreateUserRequest {
    email: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    role?: 'admin' | 'user' | 'agent';
    password: string;
}

export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: 'admin' | 'user' | 'agent';
    isActive?: boolean;
    displayPicture?: string;
}

export interface UpdateCurrentUserRequest {
    firstName?: string;
    lastName?: string;
    phone?: string;
    displayPicture?: string;
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

export const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery,
    tagTypes: ['User'],
    endpoints: (builder) => ({
        getAllUsers: builder.query<UsersResponse, { search?: string; role?: string; isActive?: string } | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params) {
                    if (params.search) searchParams.append('search', params.search);
                    if (params.role) searchParams.append('role', params.role);
                    if (params.isActive !== undefined) searchParams.append('isActive', params.isActive);
                }
                const queryString = searchParams.toString();
                return `users${queryString ? `?${queryString}` : ''}`;
            },
            providesTags: ['User'],
        }),
        getSingleUser: builder.query<SingleUserResponse, number>({
            query: (id) => `users/${id}`,
            providesTags: ['User'],
        }),
        createUser: builder.mutation<{ success: boolean; message: string; data: User }, CreateUserRequest>({
            query: (userData) => ({
                url: 'users',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: ['User'],
        }),
        updateUser: builder.mutation<{ success: boolean; message: string; data: User }, { id: number; data: UpdateUserRequest }>({
            query: ({ id, data }) => ({
                url: `users/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),
        deleteUser: builder.mutation<{ success: boolean; message: string }, number>({
            query: (id) => ({
                url: `users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['User'],
        }),
        updateCurrentUser: builder.mutation<{ success: boolean; message: string; data: User }, UpdateCurrentUserRequest>({
            query: (data) => ({
                url: 'users/updateMe',
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),
        setupPasswordFromInvite: builder.mutation<{ msg: string }, { token: string; password: string }>({
            query: (data) => ({
                url: 'auth/invite',
                method: 'POST',
                body: data,
            }),
        }),
        resendInviteEmail: builder.mutation<{ success: boolean; message: string }, number>({
            query: (id) => ({
                url: `users/${id}/resend-invite`,
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),
    }),
});

export const {
    useGetAllUsersQuery,
    useGetSingleUserQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useUpdateCurrentUserMutation,
    useSetupPasswordFromInviteMutation,
    useResendInviteEmailMutation,
} = userApi;

