"use client";
import React, { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  setMaritalStatus,
  setMarriageCertificate,
} from "@/state/applicationSlice";
import { FormInputB } from "@/app/(components)/FormInputB";
import { useFormContext } from "react-hook-form";
import { logger } from "@/utils/logger";
import { showToast } from "@/utils/toast";

export const MaritalStatus: React.FC = () => {
  const dispatch = useAppDispatch();
  const { maritalStatus, marriageCertificate } = useAppSelector(
    (state) => state.application
  );
  const maritalStatusOptions = [
    { value: "SINGLE", label: "Single" },
    { value: "MARRIED", label: "Married" },
    { value: "DIVORCED", label: "Divorced" },
    { value: "WIDOWED", label: "Widowed" },
  ];
  const { setValue } = useFormContext();

  useEffect(() => {
    setValue("maritalStatus", maritalStatus);
  }, [maritalStatus, setValue]);

  const handleMaritalStatusChange = (value: string) => {
    dispatch(setMaritalStatus(value as any));
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleMarriageCertificateUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type and size
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        showToast.error("Please upload a PDF, JPEG, or PNG file");
        return;
      }

      if (file.size > maxSize) {
        showToast.error("File size must be less than 5MB");
        return;
      }

      try {
        // Convert file to base64
        const base64Data = await convertFileToBase64(file);

        // Create unique file ID
        const fileId = `marriage_cert_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Store file data in sessionStorage
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          data: base64Data,
        };

        sessionStorage.setItem(fileId, JSON.stringify(fileData));

        // Store reference in Redux (serializable data only)
        dispatch(
          setMarriageCertificate({
            documentType: "MARRIAGE_CERTIFICATE",
            fileName: file.name,
            fileId: fileId, // Only store reference ID
            fileSize: file.size,
            // Don't store file object or base64 data in Redux
            filePath: "", // Will be filled after S3 upload
          })
        );

        logger.log("Marriage certificate stored locally:", file.name);
        showToast.success("Marriage certificate uploaded successfully");

        // Reset file input
        event.target.value = "";
      } catch (error) {
        logger.error("Error processing marriage certificate:", error);
        showToast.error("Failed to process marriage certificate. Please try again.");
      }
    },
    [dispatch]
  );

  const handleRemoveCertificate = useCallback(() => {
    // Clean up from sessionStorage before removing from Redux
    if (marriageCertificate?.fileId) {
      try {
        sessionStorage.removeItem(marriageCertificate.fileId);
        logger.log("Removed marriage certificate from sessionStorage");
      } catch (error) {
        logger.warn("Failed to remove file from sessionStorage:", error);
      }
    }

    // Remove from Redux
    dispatch(setMarriageCertificate(undefined));
  }, [dispatch, marriageCertificate]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Marital Status</h2>
      <p className="text-gray-600 mb-6">
        Please provide your marital status information.
      </p>

      <div className="max-w-md">
        <FormInputB
          label="Marital Status"
          name="maritalStatus"
          type="select"
          options={maritalStatusOptions}
          required
          onChange={handleMaritalStatusChange}
        />
      </div>

      {maritalStatus === "MARRIED" && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Marriage Certificate Upload
          </h3>
          <p className="text-gray-600 mb-4">
            Please upload a copy of your marriage certificate. This is required
            for married applicants.
          </p>

          {marriageCertificate ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 font-medium">
                    {marriageCertificate.fileName}
                  </p>
                  {marriageCertificate.fileSize && (
                    <p className="text-green-600 text-sm">
                      {formatFileSize(marriageCertificate.fileSize)}
                    </p>
                  )}
                  <p className="text-green-600 text-xs mt-1">
                    ✅ Stored locally (will upload on submission)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRemoveCertificate}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center max-w-md">
              <input
                type="file"
                id="marriageCertificate"
                onChange={handleMarriageCertificateUpload}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <label
                htmlFor="marriageCertificate"
                className="cursor-pointer block"
              >
                <div className="text-gray-400 mb-3">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <span className="text-gray-600 font-medium">
                  Upload Marriage Certificate
                </span>
                <p className="text-sm text-gray-500 mt-2">
                  PDF, JPG, PNG (Max 5MB)
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  File will be stored locally until final submission
                </p>
              </label>
            </div>
          )}
        </div>
      )}

      {(maritalStatus === "DIVORCED" || maritalStatus === "WIDOWED") && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-2xl">
          <h3 className="font-semibold text-blue-800 mb-2">
            Additional Information
          </h3>
          <p className="text-blue-700 text-sm">
            If you have any relevant documents (divorce decree, death
            certificate, etc.), please mention this to your education consultant
            who will guide you on the required documentation.
          </p>
        </div>
      )}
    </div>
  );
};
