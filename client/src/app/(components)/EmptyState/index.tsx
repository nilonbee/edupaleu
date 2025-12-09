"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import Button from "@/app/(components)/Button";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No records found",
  message = "Get started by creating your first record.",
  actionLabel,
  onAction,
  actionHref,
  icon,
}) => {
  const defaultIcon = (
    <Inbox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  );

  const actionButton = actionLabel && (onAction || actionHref) && (
    <Box className="mt-6">
      {actionHref ? (
        <Button as="link" href={actionHref} variant="primary" size="md">
          {actionLabel}
        </Button>
      ) : (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </Box>
  );

  return (
    <Box className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
      {icon || defaultIcon}
      <Typography
        variant="h6"
        className="text-gray-700 dark:text-gray-300 font-semibold mb-2"
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        className="text-gray-500 dark:text-gray-400 max-w-md"
      >
        {message}
      </Typography>
      {actionButton}
    </Box>
  );
};

export default EmptyState;

