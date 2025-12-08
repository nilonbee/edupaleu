"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useVerifyEmailMutation } from "@/state/api";
import { AuthFormWrapper } from "@/app/(components)/AuthFormWrapper";
import { Alert } from "@/app/(components)/Alert";
import Button from "@/app/(components)/Button";

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const [verifyEmail, { isLoading, isError }] = useVerifyEmailMutation();
  const [error, setError] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    text: "",
    type: "error" as "error" | "success",
  });

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (token && email) {
      verifyEmail({ verificationToken: token, email })
        .unwrap()
        .then(() => {
          setAlert({
            show: true,
            text: "Email verified successfully!",
            type: "success",
          });
        })
        .catch(() => {
          setError(true);
          setAlert({
            show: true,
            text: "Failed to verify email. Please check your verification link.",
            type: "error",
          });
        });
    } else {
      setError(true);
      setAlert({
        show: true,
        text: "Invalid verification link. Please check your email.",
        type: "error",
      });
    }
  }, [searchParams, verifyEmail]);

  const closeAlert = () => setAlert({ ...alert, show: false });

  if (isLoading) {
    return (
      <AuthFormWrapper
        title="Verifying Your Email"
        subtitle="Please wait while we confirm your email address"
      >
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
          <p className="text-white/90 text-lg">Verifying your account...</p>
        </div>
      </AuthFormWrapper>
    );
  }

  if (error || isError) {
    return (
      <AuthFormWrapper
        title="Verification Failed"
        subtitle="There was an issue verifying your email"
      >
        <Alert alert={alert} onClose={closeAlert} />
        <div className="text-center py-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-white/90 mb-2 text-lg font-medium">
            Verification Error
          </p>
          <p className="text-white/80 text-sm mb-6">
            Please double check your verification link or request a new one.
          </p>
          <div className="space-y-3 flex gap-3 justify-center">
            <Button
              as="link"
              href="/login"
              variant="gradient"
              size="md"
            >
              Go to Login
            </Button>
            <Button
              as="link"
              href="/register"
              variant="secondary"
              size="md"
            >
              Register Again
            </Button>
          </div>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Email Verified Successfully!"
      subtitle="Your account has been confirmed and is now active"
    >
      <Alert alert={alert} onClose={closeAlert} />
      <div className="text-center py-6">
        <div className="text-green-400 text-6xl mb-4">✓</div>
        <p className="text-white/90 mb-2 text-lg font-medium">
          Account Confirmed
        </p>
        <p className="text-white/80 text-sm mb-6">
          Thank you for verifying your email address. You can now access all
          features of EduPal.
        </p>
        <Button
          as="link"
          href="/login"
          variant="gradient"
          size="md"
        >
          Continue to Login
        </Button>
      </div>
    </AuthFormWrapper>
  );
}
