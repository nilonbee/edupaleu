// components/steps/DocumentsUpload.tsx
import React, { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { addDocument } from "@/state/applicationSlice";
import { useUploadDocumentMutation } from "@/state/applicationApi";

export const DocumentsUpload: React.FC = () => {
  const dispatch = useAppDispatch();
  const { documents } = useAppSelector((state) => state.application);
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();

  const documentTypes = [
    { value: "OL_CERTIFICATE", label: "OL Certificate" },
    { value: "AL_CERTIFICATE", label: "AL Certificate" },
    { value: "BACHELORS_CERTIFICATE", label: "Bachelors Certificate" },
    { value: "MASTERS_CERTIFICATE", label: "Masters Certificate" },
    { value: "LANGUAGE_PROFICIENCY", label: "Language Proficiency Test" },
    { value: "PASSPORT", label: "Passport Copy" },
    { value: "PHOTOGRAPH", label: "Photograph" },
    { value: "CV", label: "Curriculum Vitae" },
    { value: "RECOMMENDATION_LETTER", label: "Recommendation Letter" },
    { value: "OTHER", label: "Other" },
  ];

  const handleFileUpload = useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement>,
      documentType: string
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type and size
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        alert("Please upload a PDF, JPEG, PNG, or Word document");
        return;
      }

      if (file.size > maxSize) {
        alert("File size must be less than 10MB");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("document", file);
        formData.append("documentType", documentType);

        const result = await uploadDocument(formData).unwrap();

        dispatch(
          addDocument({
            documentType,
            fileName: file.name,
            filePath: result.filePath,
            fileSize: file.size,
          })
        );

        // Reset file input
        event.target.value = "";
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload document. Please try again.");
      }
    },
    [dispatch, uploadDocument]
  );

  const getDocumentName = (documentType: string) => {
    return (
      documentTypes.find((doc) => doc.value === documentType)?.label ||
      documentType
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Documents Upload
      </h2>
      <p className="text-gray-600 mb-6">
        Upload all required documents for your application.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentTypes.map((docType) => {
          const uploadedDoc = documents.find(
            (doc) => doc.documentType === docType.value
          );

          return (
            <div
              key={docType.value}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <h3 className="font-semibold text-gray-800 mb-3">
                {docType.label}
              </h3>

              {uploadedDoc ? (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-800 font-medium text-sm">
                        {uploadedDoc.fileName}
                      </p>
                      {uploadedDoc.fileSize && (
                        <p className="text-green-600 text-xs">
                          {formatFileSize(uploadedDoc.fileSize)}
                        </p>
                      )}
                    </div>
                    <span className="text-green-600 text-sm">✓ Uploaded</span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id={docType.value}
                    onChange={(e) => handleFileUpload(e, docType.value)}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor={docType.value}
                    className={`cursor-pointer block ${
                      isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <div className="text-gray-400 mb-2">
                      <svg
                        className="w-8 h-8 mx-auto"
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
                    <span className="text-sm text-gray-600">
                      {isLoading ? "Uploading..." : "Click to upload"}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG, DOC (Max 10MB)
                    </p>
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Required Documents</h3>
        <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
          <li>OL Certificate (Mandatory)</li>
          <li>AL Certificate (Mandatory)</li>
          <li>Highest Qualification Certificate (Mandatory)</li>
          <li>Language Proficiency Certificate (If applicable)</li>
          <li>Passport Copy (Mandatory)</li>
          <li>Recent Photograph</li>
        </ul>
      </div>
    </div>
  );
};
