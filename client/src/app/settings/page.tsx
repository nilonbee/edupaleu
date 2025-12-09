"use client";
import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useUpdateCurrentUserMutation } from "@/state/userApi";
import { useGetCurrentUserQuery } from "@/state/api";
import { useAppSelector } from "@/app/redux";
import { showToast } from "@/utils/toast";
import { FormInput } from "@/app/(components)/FormInput";
import Button from "@/app/(components)/Button";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";

interface SettingsFormData {
  firstName: string;
  lastName: string;
  phone: string;
}

export default function SettingsPage() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const { data: userResponse, refetch } = useGetCurrentUserQuery();
  const [updateCurrentUser, { isLoading }] = useUpdateCurrentUserMutation();
  const [uploadingDP, setUploadingDP] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = userResponse?.user || currentUser;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SettingsFormData>({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    },
  });

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await updateCurrentUser({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      }).unwrap();

      showToast.success("Profile updated successfully");
      refetch();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || error?.message || "Failed to update profile";
      showToast.error(errorMessage);
    }
  };

  const handleDPUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("Image size must be less than 10MB");
      return;
    }

    setUploadingDP(true);

    try {
      // Upload to S3 or your file storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "USER_DISPLAY_PICTURE");

      const response = await fetch("/api/v1/file-upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      const imageUrl = result.url || result.filePath;

      // Update user profile with new DP URL
      await updateCurrentUser({
        displayPicture: imageUrl,
      }).unwrap();

      showToast.success("Display picture updated successfully");
      refetch();
    } catch (error: any) {
      showToast.error(error?.message || "Failed to upload display picture");
    } finally {
      setUploadingDP(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDPClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your profile and account settings
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
        {/* Display Picture Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Display Picture</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {user?.displayPicture && user.displayPicture !== 'null' && user.displayPicture !== null ? (
                <Image
                  src={user.displayPicture}
                  alt="Profile"
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-30 h-30 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.firstName?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>
              )}
              <button
                type="button"
                onClick={handleDPClick}
                disabled={uploadingDP}
                className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full shadow-lg hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingDP ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDPUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Click the camera icon to upload a new display picture
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG or GIF. Max size 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="text-sm text-gray-600">Email</label>
              <p className="font-medium">{user?.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
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
              placeholder="Phone Number (optional)"
              register={register}
              error={errors.phone}
              autoComplete="tel"
            />

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Account Information */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Role</span>
              <span className="font-medium capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user?.mustChangePassword
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {user?.mustChangePassword
                  ? "Password Reset Required"
                  : "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
