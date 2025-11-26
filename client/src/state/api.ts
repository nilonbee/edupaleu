import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Product {
  productId: string;
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
}

export interface NewProduct {
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
}

export interface SalesSummary {
  salesSummaryId: string;
  totalValue: number;
  changePercentage?: number;
  date: string;
}

export interface PurchaseSummary {
  purchaseSummaryId: string;
  totalPurchased: number;
  changePercentage?: number;
  date: string;
}

export interface ExpenseSummary {
  expenseSummarId: string;
  totalExpenses: number;
  date: string;
}

export interface ExpenseByCategorySummary {
  expenseByCategorySummaryId: string;
  category: string;
  amount: string;
  date: string;
}

export interface DashboardMetrics {
  popularProducts: Product[];
  salesSummary: SalesSummary[];
  purchaseSummary: PurchaseSummary[];
  expenseSummary: ExpenseSummary[];
  expenseByCategorySummary: ExpenseByCategorySummary[];
}

export interface User {
  userId: number;
  name: string;
  role: string;
}

export interface AuthUser {
  user: User;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  verificationToken: string;
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  msg: string;
  user?: User;
}

// In your api.ts file


export interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  displayPicture?: string;
  nationality?: string;
  createdAt: string;
}

export interface University {
  id: number;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  ranking?: number;
  tuition_fee_range?: string;
  country?: {
    name: string;
    code: string;
  };
}

export interface ApplicationStatus {
  id: number;
  status: string;
  description?: string;
}

// In your api.ts file - use existing interfaces
export interface Application {
  id: number;
  applicationRef: string;
  studentId: number;
  universityId: number;
  intendedProgram: string;
  intakeYear: number;
  intakeMonth: string;
  applicationStatusId?: number;
  assignedAgentId?: number;
  applicationFee: number;
  feePaid: boolean;
  submissionDate?: string;
  decisionDate?: string;
  notes?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  // NEW: Use existing interfaces for joined relations
  student: Student;
  university: University;
  applicationStatus?: ApplicationStatus;
  assignedAgent?: User; // Using your existing User interface
}

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1/',
  credentials: "include", // This ensures cookies are sent with requests
});

export const api = createApi({
  baseQuery,
  reducerPath: "api",
  tagTypes: ["DashboardMetrics", "Products", "Users", "Expenses", "Auth", "Applications", "Students",
    "Universities",
    "ApplicationStatuses"],
  endpoints: (build) => ({
    // Auth endpoints
    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (credentials) => ({
        url: "auth/register",
        method: "POST",
        body: credentials,
      }),
    }),
    login: build.mutation<AuthUser, LoginRequest>({
      query: (credentials) => ({
        url: "auth/login",
        method: "POST",
        body: credentials,
        credentials: 'include',
      }),
      invalidatesTags: ["Auth"],
    }),
    logout: build.mutation<{ msg: string }, void>({
      query: () => ({
        url: "auth/logout",
        method: "DELETE",
        credentials: "include",
      }),
      invalidatesTags: ["Auth"],
    }),
    verifyEmail: build.mutation<AuthResponse, VerifyEmailRequest>({
      query: (data) => ({
        url: "auth/verify-email",
        method: "POST",
        body: data,
      }),
    }),
    forgotPassword: build.mutation<AuthResponse, ForgotPasswordRequest>({
      query: (data) => ({
        url: "auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),
    resetPassword: build.mutation<AuthResponse, ResetPasswordRequest>({
      query: (data) => ({
        url: "auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),
    getCurrentUser: build.query<AuthUser, void>({
      query: () => "users/showMe",
      providesTags: ["Auth"],
    }),
    // Dashboard endpoints
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => "dashboard",
      providesTags: ["DashboardMetrics"],
    }),
    getProducts: build.query<Product[], string | void>({
      query: (search) => ({
        url: "products",
        params: search ? { search } : {},
      }),
      providesTags: ["Products"],
    }),
    createProduct: build.mutation<Product, NewProduct>({
      query: (newProduct) => ({
        url: "products",
        method: "POST",
        body: newProduct,
      }),
      invalidatesTags: ["Products"],
    }),
    getUsers: build.query<User[], void>({
      query: () => "users",
      providesTags: ["Users"],
    }),
    getExpensesByCategory: build.query<ExpenseByCategorySummary[], void>({
      query: () => "expenses",
      providesTags: ["Expenses"],
    }),
    getApplications: build.query<Application[], void>({
      query: () => "applications",
      providesTags: ["Applications"],
    }),
    getStudents: build.query<Student[], void>({
      query: () => "students",
      providesTags: ["Students"],
    }),

    getUniversities: build.query<University[], void>({
      query: () => "universities",
      providesTags: ["Universities"],
    }),

    getApplicationStatuses: build.query<ApplicationStatus[], void>({
      query: () => "application-status",
      providesTags: ["ApplicationStatuses"],
    }),
  }),
});

export const {
  useGetDashboardMetricsQuery,
  useGetProductsQuery,
  useCreateProductMutation,
  useGetUsersQuery,
  useGetExpensesByCategoryQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetCurrentUserQuery,
  useGetApplicationsQuery,
  useGetStudentsQuery,
  useGetUniversitiesQuery,
  useGetApplicationStatusesQuery,
} = api;
