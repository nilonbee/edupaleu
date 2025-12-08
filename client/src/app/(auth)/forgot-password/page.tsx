"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";

import { useForgotPasswordMutation } from "@/state/api";
import { AuthFormWrapper } from "@/app/(components)/AuthFormWrapper";
import { FormInput } from "@/app/(components)/FormInput";
import { Alert } from "@/app/(components)/Alert";
import Button from "@/app/(components)/Button";

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

          <Button
            as="link"
            href="/login"
            variant="gradient"
            size="md"
          >
            Back to Login
          </Button>
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

        <Button
          type="submit"
          variant="gradient"
          size="md"
          isLoading={isLoading}
          className="w-full"
        >
          Get Reset Link
        </Button>

        <div className="text-sm text-center">
          <p className="text-gray-600">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
