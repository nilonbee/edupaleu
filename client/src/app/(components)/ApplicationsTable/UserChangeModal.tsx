"use client";
import React, { useState, useEffect } from 'react';
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
import { User } from '@/state/userApi';

interface UserChangeModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: number;
  applicationRef: string;
  currentUser?: User | null;
  availableUsers: User[];
  fieldType: 'assignedTo' | 'assignedAgent';
  onUserChange: (applicationId: number, userId: number | null, fieldType: 'assignedTo' | 'assignedAgent') => Promise<void>;
}

export const UserChangeModal: React.FC<UserChangeModalProps> = ({
  open,
  onClose,
  applicationId,
  applicationRef,
  currentUser,
  availableUsers,
  fieldType,
  onUserChange,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setSelectedUserId(currentUser.id.toString());
    } else {
      setSelectedUserId('');
    }
  }, [currentUser, open]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const userId = selectedUserId ? parseInt(selectedUserId, 10) : null;
      await onUserChange(applicationId, userId, fieldType);
      onClose();
      setSelectedUserId('');
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedUserId(currentUser?.id.toString() || '');
      onClose();
    }
  };

  const fieldLabel = fieldType === 'assignedTo' ? 'Handled By' : 'Agent';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Change {fieldLabel}
      </DialogTitle>
      <DialogContent>
        <div className="space-y-4 py-4">
          <Typography variant="body2" color="text.secondary">
            Application: <strong>{applicationRef}</strong>
          </Typography>
          {currentUser && (
            <Typography variant="body2" color="text.secondary">
              Current {fieldLabel}: <strong>{currentUser.firstName} {currentUser.lastName}</strong>
            </Typography>
          )}
          <FormControl fullWidth>
            <InputLabel id="user-select-label">New {fieldLabel}</InputLabel>
            <Select
              labelId="user-select-label"
              value={selectedUserId}
              label={`New ${fieldLabel}`}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isSubmitting}
            >
              <MenuItem value="">
                <em>None (Unassign)</em>
              </MenuItem>
              {availableUsers.map((user) => (
                <MenuItem key={user.id} value={user.id.toString()}>
                  {user.firstName} {user.lastName} {user.email && `(${user.email})`}
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
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? 'Updating...' : `Update ${fieldLabel}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

