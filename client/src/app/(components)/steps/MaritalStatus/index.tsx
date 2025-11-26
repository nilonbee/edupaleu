"use client";
import React, { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  setMaritalStatus,
  setMarriageCertificate,
} from "@/state/applicationSlice";
import { useUploadDocumentMutation } from "@/state/applicationApi";
import { useGetUniversitiesQuery } from "@/state/api";
import { FormInputB } from "@/app/(components)/FormInputB";
import { University } from "@/types/applications";
import { useFormContext } from "react-hook-form";

export const MaritalStatus: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    maritalStatus,
    marriageCertificate,
    student,
    selectedUniversity,
    academicQualifications,
    documents,
    intendedPrograms,
  } = useAppSelector((state) => state.application);
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();
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

  // Use a generic handler that accepts any element type
  const handleMaritalStatusChange = (value: string) => {
    dispatch(setMaritalStatus(value as any));
  };

  // Or if you want to keep the event structure:
  const handleMaritalStatusChangeWithEvent = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    dispatch(setMaritalStatus(e.target.value as any));
  };

  const handleMarriageCertificateUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type and size
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        alert("Please upload a PDF, JPEG, or PNG file");
        return;
      }

      if (file.size > maxSize) {
        alert("File size must be less than 5MB");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("document", file);
        formData.append("documentType", "MARRIAGE_CERTIFICATE");

        const result = await uploadDocument(formData).unwrap();

        dispatch(
          setMarriageCertificate({
            documentType: "MARRIAGE_CERTIFICATE",
            fileName: file.name,
            filePath: result.filePath,
            fileSize: file.size,
          })
        );

        // Reset file input
        event.target.value = "";
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload marriage certificate. Please try again.");
      }
    },
    [dispatch, uploadDocument]
  );

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

      {/* Rest of the component remains the same */}
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
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 text-sm">✓ Uploaded</span>
                  <button
                    onClick={() => dispatch(setMarriageCertificate())}
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
                disabled={isLoading}
              />
              <label
                htmlFor="marriageCertificate"
                className={`cursor-pointer block ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
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
                  {isLoading ? "Uploading..." : "Upload Marriage Certificate"}
                </span>
                <p className="text-sm text-gray-500 mt-2">
                  PDF, JPG, PNG (Max 5MB)
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
