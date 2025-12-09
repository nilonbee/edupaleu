"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useResetPasswordMutation } from "@/state/api";

import { AuthFormWrapper } from "@/app/(components)/AuthFormWrapper";
import { FormInput } from "@/app/(components)/FormInput";
import { Alert } from "@/app/(components)/Alert";
import Button from "@/app/(components)/Button";

interface ResetPasswordFormData {
  password: string;
}

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordFormData>();

  const [resetPassword, { isLoading, isError, error }] =
    useResetPasswordMutation();

  const [alert, setAlert] = useState({
    show: false,
    text: "",
    type: "error" as "error" | "success",
  });

  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setAlert({ show: false, text: "", type: "error" });

    try {
      await resetPassword({
        password: data.password,
        token: searchParams.get("token") || "",
        email: searchParams.get("email") || "",
      }).unwrap();

      setSuccess(true);
      reset();

      setAlert({
        show: true,
        text: "Password changed successfully! Redirecting to login…",
        type: "success",
      });

      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setAlert({
        show: true,
        text: err?.data?.msg || "An error occurred",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (isError && error) {
      const errMsg =
        "data" in error ? (error.data as any)?.msg : "An error occurred";
      setAlert({ show: true, text: errMsg, type: "error" });
    }
  }, [isError, error]);

  const closeAlert = () => setAlert({ ...alert, show: false });

  if (success) {
    return (
      <AuthFormWrapper
        title="Password Updated"
        subtitle="Your password has been successfully reset"
      >
        <Alert alert={alert} onClose={closeAlert} />

        <div className="text-center py-6">
          <div className="text-green-600 text-6xl mb-4">✔️</div>
          <p className="text-gray-900 mb-2 text-lg font-medium">
            Redirecting to login…
          </p>

          <Button
            onClick={() => router.push("/login")}
            variant="primary"
            size="md"
          >
            Go to Login Now
          </Button>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Reset Your Password"
      subtitle="Enter your new password below"
    >
      <Alert alert={alert} onClose={closeAlert} />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="password"
          name="password"
          type="password"
          placeholder="New Password"
          register={register}
          error={errors.password}
          required
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full"
        >
          Set New Password
        </Button>
      </form>
    </AuthFormWrapper>
  );
}
