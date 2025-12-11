"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Typography,
  Alert,
} from "@mui/material";
import { ApplicationStatus } from "@/state/api";

interface StatusChangeModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: number;
  applicationRef: string;
  currentStatus?: string;
  currentRegistered?: boolean;
  availableStatuses: ApplicationStatus[];
  onStatusChange: (applicationId: number, newStatus: string) => Promise<void>;
  isAdmin?: boolean;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  open,
  onClose,
  applicationId,
  applicationRef,
  currentStatus,
  currentRegistered = false,
  availableStatuses,
  onStatusChange,
  isAdmin = false,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletedWarning, setShowCompletedWarning] = useState(false);

  const isCompleted = currentStatus?.toLowerCase() === "completed";
  const canChangeStatus = isAdmin || !isCompleted;

  useEffect(() => {
    if (open) {
      setSelectedStatus("");
      setShowCompletedWarning(false);
    }
  }, [open]);

  useEffect(() => {
    if (selectedStatus?.toLowerCase() === "completed") {
      setShowCompletedWarning(true);
    } else {
      setShowCompletedWarning(false);
    }
  }, [selectedStatus]);

  const handleSubmit = async () => {
    if (!selectedStatus) return;

    setIsSubmitting(true);
    try {
      await onStatusChange(applicationId, selectedStatus);
      onClose();
      setSelectedStatus("");
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedStatus("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Application Status</DialogTitle>
      <DialogContent>
        <div className="space-y-4 py-4">
          <Typography variant="body2" color="text.secondary">
            Application: <strong>{applicationRef}</strong>
          </Typography>
          {currentStatus && (
            <Typography variant="body2" color="text.secondary">
              Current Status: <strong>{currentStatus}</strong>
            </Typography>
          )}
          {!canChangeStatus && (
            <Alert severity="warning">
              This application is marked as <strong>completed</strong>. Only
              administrators can change the status of completed applications.
            </Alert>
          )}
          <FormControl fullWidth>
            <InputLabel id="status-select-label">New Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={selectedStatus}
              label="New Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={isSubmitting || !canChangeStatus}
            >
              {availableStatuses.map((status) => (
                <MenuItem key={status.id} value={status.status}>
                  {status.status
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  {status.description && (
                    <span className="text-gray-500 text-sm ml-2">
                      - {status.description}
                    </span>
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {showCompletedWarning && (
            <Alert severity="info">
              Setting status to <strong>completed</strong> will lock this
              application. Only administrators will be able to change the status
              after it is marked as completed.
            </Alert>
          )}
        </div>
      </DialogContent>
      <DialogActions className="px-6 py-4">
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedStatus || isSubmitting || !canChangeStatus}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? "Updating..." : "Update Status"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
