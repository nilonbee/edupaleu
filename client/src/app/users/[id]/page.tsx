"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useGetSingleUserQuery } from "@/state/userApi";
import Button from "@/app/(components)/Button";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ViewUserPage() {
  const params = useParams();
  const userId = params?.id ? parseInt(params.id as string, 10) : null;

  const {
    data: userResponse,
    isLoading,
    error,
  } = useGetSingleUserQuery(userId!, {
    skip: !userId,
  });

  if (!userId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Invalid User ID
          </h1>
          <p className="text-gray-600 mb-4">
            The user ID provided is invalid.
          </p>
          <Button as="link" href="/users" variant="primary" size="md">
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (error || !userResponse?.data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            User Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The user you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Button as="link" href="/users" variant="primary" size="md">
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  const user = userResponse.data;

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: string | Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "AGENT":
        return "bg-blue-100 text-blue-800";
      case "USER":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/users">
          <Button variant="secondary" size="sm" className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>

        <h1 className="text-2xl font-bold">User Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Profile Picture and Basic Info */}
        <div className="flex items-start gap-6 pb-6 border-b border-gray-200">
          <div className="relative">
            {user.displayPicture ? (
              <Image
                src={user.displayPicture}
                alt={`${user.firstName} ${user.lastName}`}
                width={120}
                height={120}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-[120px] h-[120px] rounded-full bg-primary-500 flex items-center justify-center text-white text-3xl font-semibold">
                {user.firstName?.[0]?.toUpperCase() ||
                  user.email?.[0]?.toUpperCase() ||
                  "U"}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">
              {user.firstName} {user.lastName}
            </h2>
            <div className="flex items-center gap-4 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(
                  user.role
                )}`}
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              {user.isActive ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-4 h-4" />
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="font-medium">{user.email}</p>
            </div>
            {user.phone && (
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                <p className="font-medium">{user.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Role</label>
              <p className="font-medium">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Status</label>
              <p className="font-medium">
                {user.isActive ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Inactive</span>
                )}
              </p>
            </div>
            {user.mustChangePassword !== undefined && (
              <div>
                <label className="text-sm text-gray-600">
                  Password Change Required
                </label>
                <p className="font-medium">
                  {user.mustChangePassword ? "Yes" : "No"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Activity Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Account Created</label>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
            {user.lastLogin && (
              <div>
                <label className="text-sm text-gray-600">Last Login</label>
                <p className="font-medium">{formatDateTime(user.lastLogin)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

