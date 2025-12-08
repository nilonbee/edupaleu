"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ScrollbarProps {
  children: React.ReactNode;
  className?: string;
  orientation?: "vertical" | "horizontal" | "both";
}

const Scrollbar = ({ 
  children, 
  className,
  orientation = "vertical"
}: ScrollbarProps) => {
  const orientationClasses = {
    vertical: "overflow-y-auto",
    horizontal: "overflow-x-auto",
    both: "overflow-auto",
  };

  return (
    <div
      className={cn(
        orientationClasses[orientation],
        "scrollbar-theme",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Scrollbar;
