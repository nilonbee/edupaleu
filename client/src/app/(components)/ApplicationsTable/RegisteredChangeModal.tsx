"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

interface RegisteredChangeModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: number;
  applicationRef: string;
  currentRegistered?: boolean;
  onRegisteredChange: (applicationId: number, registered: boolean) => Promise<void>;
}

export const RegisteredChangeModal: React.FC<RegisteredChangeModalProps> = ({
  open,
  onClose,
  applicationId,
  applicationRef,
  currentRegistered = false,
  onRegisteredChange,
}) => {
  const [registered, setRegistered] = useState<boolean>(currentRegistered);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRegistered(currentRegistered ?? false);
    }
  }, [open, currentRegistered]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onRegisteredChange(applicationId, registered);
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRegistered(currentRegistered);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Registration Status</DialogTitle>
      <DialogContent>
        <div className="space-y-4 py-4">
          <Typography variant="body2" color="text.secondary">
            Application: <strong>{applicationRef}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current Status: <strong>{currentRegistered ? "Registered" : "Not Registered"}</strong>
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={registered}
                onChange={(e) => setRegistered(e.target.checked)}
                disabled={isSubmitting}
              />
            }
            label="Registered"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Check this box to mark the application as registered, or uncheck to mark as not registered.
          </Typography>
        </div>
      </DialogContent>
      <DialogActions className="px-6 py-4">
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? "Updating..." : "Update Registration"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

