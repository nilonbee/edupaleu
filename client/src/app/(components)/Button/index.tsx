"use client";

import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gradient";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
  as?: "button" | "link";
  href?: string;
}

const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className,
      children,
      as = "button",
      href,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg",
      secondary:
        "bg-slate-700 text-slate-100 hover:bg-slate-600 focus:ring-slate-500 shadow-lg border border-slate-600",
      gradient:
        "bg-gradient-theme-button text-white hover:bg-gradient-theme-button-hover focus:ring-cyan-400 shadow-lg shadow-cyan-500/20 border border-cyan-400/30",
    };

    const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-3 text-sm",
      lg: "px-6 py-4 text-base",
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (as === "link" && href) {
      return (
        <Link href={href} className={classes} ref={ref as any}>
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref as any}
        disabled={disabled || isLoading}
        className={classes}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
