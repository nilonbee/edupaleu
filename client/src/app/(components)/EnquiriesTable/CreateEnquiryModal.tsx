"use client";
import React, { useState, useRef } from 'react';
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
} from '@mui/material';
import { useCreateEnquiryMutation } from '@/state/enquiryApi';
import { useGetAllUsersQuery } from '@/state/userApi';
import { useAppSelector } from '@/app/redux';
import { showToast } from '@/utils/toast';
import { FormInput } from '@/app/(components)/FormInput';
import Button from '@/app/(components)/Button';

interface CreateEnquiryModalProps {
  open: boolean;
  onClose: () => void;
}

interface CreateEnquiryFormData {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  cvDocument?: string;
  firstFollowUpRemarks?: string;
  secondFollowUpRemarks?: string;
  thirdFollowUpRemarks?: string;
  remarks?: string;
  assignedToId?: string;
}

export const CreateEnquiryModal: React.FC<CreateEnquiryModalProps> = ({ open, onClose }) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [createEnquiry, { isLoading }] = useCreateEnquiryMutation();
  const { data: usersResponse } = useGetAllUsersQuery();
  const [uploadingCV, setUploadingCV] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const users = usersResponse?.data || [];
  const agents = users.filter(u => u.role === 'agent' || u.role === 'admin');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateEnquiryFormData>({
    defaultValues: {
      assignedToId: currentUser?.userId?.toString(),
    },
  });

  const cvDocument = watch('cvDocument');

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      showToast.error('Please select a PDF or Word document');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      showToast.error('File size must be less than 20MB');
      return;
    }

    setUploadingCV(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'CV_DOCUMENT');

      const response = await fetch('/api/v1/file-upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const fileUrl = result.url || result.filePath;
      setValue('cvDocument', fileUrl);
      showToast.success('CV uploaded successfully');
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to upload CV');
    } finally {
      setUploadingCV(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: CreateEnquiryFormData) => {
    try {
      await createEnquiry({
        firstName: data.firstName,
        lastName: data.lastName || undefined,
        email: data.email || undefined,
        phone: data.phone,
        cvDocument: data.cvDocument || undefined,
        firstFollowUpRemarks: data.firstFollowUpRemarks || undefined,
        secondFollowUpRemarks: data.secondFollowUpRemarks || undefined,
        thirdFollowUpRemarks: data.thirdFollowUpRemarks || undefined,
        remarks: data.remarks || undefined,
        assignedToId: data.assignedToId ? parseInt(data.assignedToId, 10) : undefined,
      }).unwrap();

      showToast.success('Enquiry created successfully');
      reset();
      onClose();
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to create enquiry';
      showToast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Create New Enquiry</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First Name *"
                register={register}
                error={errors.firstName}
                required
              />
              <FormInput
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last Name"
                register={register}
                error={errors.lastName}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                register={register}
                error={errors.email}
              />
              <FormInput
                id="phone"
                name="phone"
                type="tel"
                placeholder="Phone Number *"
                register={register}
                error={errors.phone}
                required
              />
            </div>

            <div>
              <InputLabel className="mb-2">CV Document</InputLabel>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCVUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploadingCV}
                >
                  {cvDocument ? 'Change CV' : 'Upload CV'}
                </Button>
                {cvDocument && (
                  <Typography variant="body2" className="text-green-600">
                    CV uploaded
                  </Typography>
                )}
              </div>
            </div>

            <FormControl fullWidth>
              <InputLabel>Assigned To</InputLabel>
              <Select
                {...register('assignedToId')}
                defaultValue={currentUser?.userId?.toString()}
              >
                <MenuItem value="">None</MenuItem>
                {agents.map((user) => (
                  <MenuItem key={user.id} value={user.id.toString()}>
                    {user.firstName} {user.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormInput
              id="firstFollowUpRemarks"
              name="firstFollowUpRemarks"
              type="text"
              placeholder="First Follow-up Remarks"
              register={register}
              error={errors.firstFollowUpRemarks}
            />

            <FormInput
              id="secondFollowUpRemarks"
              name="secondFollowUpRemarks"
              type="text"
              placeholder="Second Follow-up Remarks"
              register={register}
              error={errors.secondFollowUpRemarks}
            />

            <FormInput
              id="thirdFollowUpRemarks"
              name="thirdFollowUpRemarks"
              type="text"
              placeholder="Third Follow-up Remarks"
              register={register}
              error={errors.thirdFollowUpRemarks}
            />

            <TextField
              {...register('remarks')}
              label="Remarks"
              multiline
              rows={3}
              fullWidth
              className="mt-4"
            />
          </div>
        </DialogContent>
        <DialogActions className="p-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            Create Enquiry
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

