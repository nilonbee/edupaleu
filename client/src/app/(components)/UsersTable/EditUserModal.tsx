"use client";
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  useGetSingleUserQuery,
  useUpdateUserMutation,
  User,
} from '@/state/userApi';
import { useAppSelector } from '@/app/redux';
import { showToast } from '@/utils/toast';
import { FormInput } from '@/app/(components)/FormInput';
import Button from '@/app/(components)/Button';

interface EditUserModalProps {
  open: boolean;
  userId: number;
  onClose: () => void;
}

interface EditUserFormData {
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'user' | 'agent';
  isActive: boolean;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ open, userId, onClose }) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const { data: userResponse, isLoading: isLoadingUser } = useGetSingleUserQuery(userId);
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const user = userResponse?.data;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EditUserFormData>();

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        role: user.role as 'admin' | 'user' | 'agent',
        isActive: user.isActive,
      });
    }
  }, [user, reset]);

  const isActive = watch('isActive');

  const onSubmit = async (data: EditUserFormData) => {
    try {
      await updateUser({
        id: userId,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || undefined,
          role: data.role,
          isActive: currentUser?.role === 'admin' ? data.isActive : undefined,
        },
      }).unwrap();

      showToast.success('User updated successfully');
      onClose();
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to update user';
      showToast.error(errorMessage);
    }
  };

  if (isLoadingUser) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
          <Typography className="mt-4">Loading user data...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <Typography variant="caption" className="text-gray-600">Email</Typography>
              <Typography className="font-medium">{user.email}</Typography>
              <Typography variant="caption" className="text-gray-500">
                Email cannot be changed
              </Typography>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First Name"
                register={register}
                error={errors.firstName}
                required
                autoComplete="given-name"
              />

              <FormInput
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last Name"
                register={register}
                error={errors.lastName}
                autoComplete="family-name"
              />
            </div>

            <FormInput
              id="phone"
              name="phone"
              type="tel"
              placeholder="Phone (optional)"
              register={register}
              error={errors.phone}
              autoComplete="tel"
            />

            <FormControl fullWidth error={!!errors.role}>
              <InputLabel>Role</InputLabel>
              <Select
                {...register('role', { required: 'Role is required' })}
                label="Role"
                defaultValue={user.role}
              >
                <MenuItem value="user">User</MenuItem>
                {(currentUser?.role === 'admin' || currentUser?.role === 'agent') && (
                  <MenuItem value="agent">Agent</MenuItem>
                )}
                {currentUser?.role === 'admin' && (
                  <MenuItem value="admin">Admin</MenuItem>
                )}
              </Select>
              {errors.role && (
                <Typography variant="caption" color="error" className="mt-1 ml-3">
                  {errors.role.message}
                </Typography>
              )}
            </FormControl>

            {currentUser?.role === 'admin' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    {...register('isActive')}
                    onChange={(e) => setValue('isActive', e.target.checked)}
                  />
                }
                label="Active Account"
              />
            )}
          </div>
        </DialogContent>
        <DialogActions className="p-4">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
          >
            Update User
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

