// app/(auth)/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useLoginMutation } from "@/state/api";
import { useAppDispatch } from "@/app/redux";
import { setUser, clearUser } from "@/state/authSlice";
import { AuthFormWrapper } from "@/app/(components)/AuthFormWrapper";
import { FormInput } from "@/app/(components)/FormInput";
import { Alert } from "@/app/(components)/Alert";

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>();

  const [login, { isLoading, isError, error }] = useLoginMutation();

  const [alert, setAlert] = useState({
    show: false,
    text: "",
    type: "error" as "error" | "success",
  });

  const onSubmit = async (data: LoginFormData) => {
    setAlert({ show: false, text: "", type: "error" });

    try {
      // Attempt login with provided credentials
      const result = await login(data).unwrap();

      // Validate response before updating state
      if (result?.user) {
        dispatch(setUser(result.user));

        setAlert({
          show: true,
          text: `Welcome, ${result.user.name}. Redirecting...`,
          type: "success",
        });

        reset();

        // Redirect after short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        // Unexpected structure or mismatch
        dispatch(clearUser());
        setAlert({
          show: true,
          text: "Unexpected login response. Please try again.",
          type: "error",
        });
      }
    } catch (err: any) {
      // Clear any stale user state
      dispatch(clearUser());

      // Show error message from backend or fallback
      const errorMsg =
        err?.data?.msg ||
        err?.error ||
        "Login failed. Please check your credentials.";
      setAlert({
        show: true,
        text: errorMsg,
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (isError && error) {
      const errorMessage =
        "data" in error ? (error.data as any)?.msg : "Login failed";
      setAlert({
        show: true,
        text: errorMessage,
        type: "error",
      });
    }
  }, [isError, error]);

  const closeAlert = () => setAlert({ ...alert, show: false });

  return (
    <AuthFormWrapper
      title="Sign in to your account"
      subtitle="Enter your credentials to access your dashboard"
    >
      <Alert alert={alert} onClose={closeAlert} />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <FormInput
            id="email"
            name="email"
            type="email"
            placeholder="Email address"
            register={register}
            error={errors.email}
            required
            autoComplete="email"
          />

          <FormInput
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            register={register}
            error={errors.password}
            required
            autoComplete="current-password"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-blue-500 rounded-lg shadow-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign in"
            )}
          </button>
        </div>

        <div className="text-sm text-center space-y-3">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Create one here
            </Link>
          </p>
          <p className="text-gray-600">
            Forgot your password?{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Reset it
            </Link>
          </p>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
