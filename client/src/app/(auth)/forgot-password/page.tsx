"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Link from "next/link";
import { useForgotPasswordMutation } from "@/state/api";
import { AuthFormData, AlertState } from "@/types/auth";
import { AuthFormWrapper } from "@/app/(components)/AuthFormWrapper";
import { FormInput } from "@/app/(components)/FormInput";
import { Alert } from "@/app/(components)/Alert";

interface ForgotPasswordData {
  email: string;
}

export default function ForgotPassword() {
  const [forgotPassword, { isLoading, isError, error }] =
    useForgotPasswordMutation();
  const [success, setSuccess] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    text: "",
    type: "error",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordData>();

  const onSubmit = async (data: ForgotPasswordData) => {
    setAlert({ show: false, text: "", type: "error" });

    try {
      const result = await forgotPassword(data).unwrap();
      setSuccess(true);
      reset();
      setAlert({ show: true, text: result.msg, type: "success" });
    } catch (err: any) {
      setAlert({
        show: true,
        text: err?.data?.msg || "Something went wrong, please try again",
        type: "error",
      });
      // Still show success state for security (don't reveal if email exists)
      setSuccess(true);
    }
  };

  useEffect(() => {
    if (isError && error) {
      const errorMessage =
        "data" in error
          ? (error.data as any)?.msg
          : "Something went wrong, please try again";
      setAlert({ show: true, text: errorMessage, type: "error" });
      setSuccess(true);
    }
  }, [isError, error]);

  const closeAlert = () => setAlert({ ...alert, show: false });

  if (success) {
    return (
      <AuthFormWrapper
        title="Check Your Email"
        subtitle="We've sent password reset instructions to your email"
      >
        <Alert alert={alert} onClose={closeAlert} />
        <div className="text-center py-6">
          <div className="text-blue-500 text-6xl mb-4">✉️</div>
          <p className="text-gray-900 mb-2 text-lg font-medium">
            Password Reset Email Sent
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Please check your inbox and follow the instructions to reset your
            password.
          </p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-blue-500 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Reset Your Password"
      subtitle="Enter your email and we'll send you reset instructions"
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
                Sending...
              </div>
            ) : (
              "Get Reset Password Link"
            )}
          </button>
        </div>

        <div className="text-sm text-center">
          <p className="text-gray-600">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
