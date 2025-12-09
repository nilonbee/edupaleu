"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "full" | "xl" | "2xl" | "4xl" | "5xl" | "6xl" | "7xl";
  noPadding?: boolean;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  className,
  maxWidth = "full",
  noPadding = false,
}) => {
  const maxWidthClasses = {
    full: "max-w-full",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  };

  return (
    <div
      className={cn(
        "w-full h-full",
        maxWidthClasses[maxWidth],
        !noPadding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageWrapper;

