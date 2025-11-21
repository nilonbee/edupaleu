// app/(auth)/register/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRegisterMutation } from "@/state/api";
import { AuthFormWrapper } from "@/app/(components)/AuthFormWrapper";
import { FormInput } from "@/app/(components)/FormInput";
import { Alert } from "@/app/(components)/Alert";

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function Register() {
  const [register, { isLoading, isError, error }] = useRegisterMutation();
  const [success, setSuccess] = useState(false);

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>();

  const [alert, setAlert] = useState({
    show: false,
    text: "",
    type: "error" as "error" | "success",
  });

  const onSubmit = async (data: RegisterFormData) => {
    setAlert({ show: false, text: "", type: "error" });

    try {
      const result = await register(data).unwrap();
      setSuccess(true);
      reset();
      setAlert({ show: true, text: result.msg, type: "success" });
    } catch (err: any) {
      const errorMessage = err?.data?.msg || "There was an error";
      setAlert({ show: true, text: errorMessage, type: "error" });
    }
  };

  useEffect(() => {
    if (isError && error) {
      const errorMessage =
        "data" in error ? (error.data as any)?.msg : "There was an error";
      setAlert({ show: true, text: errorMessage, type: "error" });
    }
  }, [isError, error]);

  const closeAlert = () => setAlert({ ...alert, show: false });

  return (
    <AuthFormWrapper
      title="Create your account"
      subtitle="Join thousands of students using EduPal"
    >
      <Alert alert={alert} onClose={closeAlert} />

      {!success ? (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First Name"
                register={registerForm}
                error={errors.firstName}
                required
                autoComplete="given-name"
              />

              <FormInput
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last Name"
                register={registerForm}
                error={errors.lastName}
                required
                autoComplete="family-name"
              />
            </div>

            <FormInput
              id="email"
              name="email"
              type="email"
              placeholder="Email address"
              register={registerForm}
              error={errors.email}
              required
              autoComplete="email"
            />

            <FormInput
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              register={registerForm}
              error={errors.password}
              required
              autoComplete="new-password"
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
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>

          <div className="text-sm text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      ) : (
        <div className="text-center py-6">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <p className="text-gray-900 mb-2 text-lg font-medium">
            Registration Successful!
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Please check your email to verify your account.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-blue-500 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      )}
    </AuthFormWrapper>
  );
}
