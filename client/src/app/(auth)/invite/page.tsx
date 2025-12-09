"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useSetupPasswordFromInviteMutation } from "@/state/userApi";
import { AuthFormWrapper } from "@/app/(components)/AuthFormWrapper";
import { FormInput } from "@/app/(components)/FormInput";
import { Alert } from "@/app/(components)/Alert";
import Button from "@/app/(components)/Button";
import { useAppSelector, useAppDispatch } from "@/app/redux";
import { clearUser } from "@/state/authSlice";
import { useLogoutMutation } from "@/state/api";

interface InviteFormData {
  password: string;
  confirmPassword: string;
}

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<InviteFormData>();

  const [setupPassword, { isLoading, isError, error }] =
    useSetupPasswordFromInviteMutation();

  const [alert, setAlert] = useState({
    show: false,
    text: "",
    type: "error" as "error" | "success",
  });

  const password = watch("password");

  // Logout if user is authenticated when accessing invite page
  useEffect(() => {
    if (isAuthenticated && !hasLoggedOut && token) {
      const handleLogout = async () => {
        try {
          await logout().unwrap();
          dispatch(clearUser());
          setHasLoggedOut(true);
        } catch (error) {
          // Even if logout fails, clear local state
          dispatch(clearUser());
          setHasLoggedOut(true);
        }
      };
      handleLogout();
    }
  }, [isAuthenticated, hasLoggedOut, token, logout, dispatch]);

  useEffect(() => {
    if (!token) {
      setAlert({
        show: true,
        text: "Invalid invite link. Please check your email for the correct link.",
        type: "error",
      });
    }
  }, [token]);

  const onSubmit = async (data: InviteFormData) => {
    if (!token) {
      setAlert({
        show: true,
        text: "Invalid invite token",
        type: "error",
      });
      return;
    }

    if (data.password !== data.confirmPassword) {
      setAlert({
        show: true,
        text: "Passwords do not match",
        type: "error",
      });
      return;
    }

    setAlert({ show: false, text: "", type: "error" });

    try {
      await setupPassword({
        token,
        password: data.password,
      }).unwrap();

      setAlert({
        show: true,
        text: "Password set successfully! Redirecting to login...",
        type: "success",
      });

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      const errorMsg =
        err?.data?.msg ||
        err?.error ||
        "Failed to set password. The invite link may have expired.";
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
        "data" in error ? (error.data as any)?.msg : "Failed to set password";
      setAlert({
        show: true,
        text: errorMessage,
        type: "error",
      });
    }
  }, [isError, error]);

  const closeAlert = () => setAlert({ ...alert, show: false });

  // Show loading while logging out
  if (isAuthenticated && !hasLoggedOut) {
    return (
      <AuthFormWrapper
        title="Logging Out"
        subtitle="Please wait while we log you out..."
      >
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing invite form...</p>
        </div>
      </AuthFormWrapper>
    );
  }

  if (!token) {
    return (
      <AuthFormWrapper
        title="Invalid Invite Link"
        subtitle="Please check your email for the correct invitation link"
      >
        <Alert alert={alert} onClose={closeAlert} />
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">
            The invite link is missing or invalid. Please contact your
            administrator.
          </p>
          <Button as="link" href="/login" variant="primary" size="md">
            Go to Login
          </Button>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Set Up Your Account"
      subtitle="Create a password to complete your account setup"
    >
      <Alert alert={alert} onClose={closeAlert} />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <FormInput
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            register={register}
            error={errors.password}
            required
            autoComplete="new-password"
          />

          <FormInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            register={register}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
            validate={(value) => {
              if (value !== password) {
                return "Passwords do not match";
              }
            }}
          />
        </div>

        <div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full"
          >
            Set Password
          </Button>
        </div>

        <div className="text-sm text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Sign in here
            </a>
          </p>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
