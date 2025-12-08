"use client";
import React, { useState } from 'react';
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
} from '@mui/material';
import { ApplicationStatus } from '@/state/api';

interface StatusChangeModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: number;
  applicationRef: string;
  currentStatus?: string;
  availableStatuses: ApplicationStatus[];
  onStatusChange: (applicationId: number, newStatus: string) => Promise<void>;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  open,
  onClose,
  applicationId,
  applicationRef,
  currentStatus,
  availableStatuses,
  onStatusChange,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedStatus) return;

    setIsSubmitting(true);
    try {
      await onStatusChange(applicationId, selectedStatus);
      onClose();
      setSelectedStatus('');
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedStatus('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Change Application Status
      </DialogTitle>
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
          <FormControl fullWidth>
            <InputLabel id="status-select-label">New Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={selectedStatus}
              label="New Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={isSubmitting}
            >
              {availableStatuses.map((status) => (
                <MenuItem key={status.id} value={status.status}>
                  {status.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  {status.description && (
                    <span className="text-gray-500 text-sm ml-2">
                      - {status.description}
                    </span>
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </DialogContent>
      <DialogActions className="px-6 py-4">
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedStatus || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? 'Updating...' : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


