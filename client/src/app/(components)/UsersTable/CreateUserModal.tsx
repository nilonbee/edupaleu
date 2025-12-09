"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useCreateUserMutation } from '@/state/userApi';
import { useAppSelector } from '@/app/redux';
import { showToast } from '@/utils/toast';
import { FormInput } from '@/app/(components)/FormInput';
import Button from '@/app/(components)/Button';

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
}

interface CreateUserFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'user' | 'agent';
  password: string;
  confirmPassword: string;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ open, onClose }) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [createUser, { isLoading }] = useCreateUserMutation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateUserFormData>({
    defaultValues: {
      role: 'user',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: CreateUserFormData) => {
    if (data.password !== data.confirmPassword) {
      showToast.error('Passwords do not match');
      return;
    }

    try {
      await createUser({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        role: data.role,
        password: data.password,
      }).unwrap();

      showToast.success('User created successfully. Invite email sent.');
      reset();
      onClose();
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to create user';
      showToast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <FormInput
              id="email"
              name="email"
              type="email"
              placeholder="Email address"
              register={register}
              error={errors.email}
              required
              autoComplete="email"
            />

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
                defaultValue="user"
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="agent">Agent</MenuItem>
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

            <FormInput
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              register={register}
              error={errors.password}
              required
              autoComplete="new-password"
            />

            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              register={register}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />
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
            Create User
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

