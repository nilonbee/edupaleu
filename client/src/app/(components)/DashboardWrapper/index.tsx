"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/app/(components)/Navbar";
import Sidebar from "@/app/(components)/Sidebar";
import StoreProvider, { useAppSelector } from "@/app/redux";
import { useGetCurrentUserQuery } from "@/state/api";
import { setUser, clearUser } from "@/state/authSlice";
import { useAppDispatch } from "@/app/redux";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Check if current route is an auth route (public routes)
  const authRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ];
  const isAuthRoute = authRoutes.some((route) => pathname?.startsWith(route));

  // Skip auth check for public auth routes (login, register, etc.)
  const { data, isLoading, isError } = useGetCurrentUserQuery(undefined, {
    skip: isAuthRoute, // Don't check auth for public routes
  });

  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  // Update auth state when user data changes
  useEffect(() => {
    if (data?.user) {
      dispatch(setUser(data.user));
    } else if (isError && !isAuthRoute) {
      // Only clear user if we're not on an auth route (expected to fail on auth routes)
      dispatch(clearUser());
    }
  }, [data, isError, isAuthRoute, dispatch]);

  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthRoute && !isAuthenticated) {
        router.push("/login");
      } else if (isAuthRoute && isAuthenticated) {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthRoute, isAuthenticated, router]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

  // For auth routes, don't show sidebar/navbar
  if (isAuthRoute) {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  // For protected routes, show loading if auth is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className={`${
        isDarkMode ? "dark" : "light"
      } flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 text-slate-900 dark:text-slate-100 w-full min-h-screen`}
    >
      <Sidebar />
      <main
        className={`flex flex-col w-full h-full py-7 px-9 bg-gradient-to-br from-slate-50/80 via-blue-50/20 to-indigo-100/30 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-indigo-950/80 backdrop-blur-sm ${
          isSidebarCollapsed ? "md:pl-24" : "md:pl-72"
        }`}
      >
        <Navbar />
        {children}
      </main>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </StoreProvider>
  );
};

export default DashboardWrapper;
