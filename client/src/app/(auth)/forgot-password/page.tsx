"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";

import { useForgotPasswordMutation } from "@/state/api";
import { AuthFormWrapper } from "@/app/(components)/AuthFormWrapper";
import { FormInput } from "@/app/(components)/FormInput";
import { Alert } from "@/app/(components)/Alert";

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormData>();

  const [forgotPassword, { isLoading, isError, error }] =
    useForgotPasswordMutation();

  const [success, setSuccess] = useState(false);

  const [alert, setAlert] = useState({
    show: false,
    text: "",
    type: "error" as "error" | "success",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
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

      // For security, always show success state
      setSuccess(true);
    }
  };

  useEffect(() => {
    if (isError && error) {
      const errMsg =
        "data" in error ? (error.data as any)?.msg : "Something went wrong";
      setAlert({ show: true, text: errMsg, type: "error" });
      setSuccess(true);
    }
  }, [isError, error]);

  const closeAlert = () => setAlert({ ...alert, show: false });

  if (success) {
    return (
      <AuthFormWrapper
        title="Check Your Email"
        subtitle="We've sent password reset instructions to your inbox"
      >
        <Alert alert={alert} onClose={closeAlert} />

        <div className="text-center py-6">
          <div className="text-blue-600 text-6xl mb-4">✉️</div>

          <p className="text-gray-900 mb-2 text-lg font-medium">
            Password Reset Email Sent
          </p>

          <p className="text-gray-600 text-sm mb-6">
            Please check your email and follow the instructions.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center px-4 py-3 rounded-lg 
            bg-blue-600 text-white text-sm font-medium 
            hover:bg-blue-700 transition-colors shadow"
          >
            Back to Login
          </Link>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you reset instructions"
    >
      <Alert alert={alert} onClose={closeAlert} />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-blue-500 
            rounded-lg shadow-lg text-sm font-medium text-white bg-blue-600 
            hover:bg-blue-700 transition-colors disabled:opacity-50 
            disabled:cursor-not-allowed focus:outline-none 
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? "Sending..." : "Get Reset Link"}
        </button>

        <div className="text-sm text-center">
          <p className="text-gray-600">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
