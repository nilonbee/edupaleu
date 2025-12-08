// components/steps/DocumentsUpload.tsx
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addDocument,
  removeDocument,
  selectDocuments,
} from "@/state/applicationSlice";
import { logger } from "@/utils/logger";
import { showToast } from "@/utils/toast";
import { APPLICATION_CONSTANTS } from "@/utils/constants";

export const DocumentsUpload: React.FC = () => {
  const dispatch = useDispatch();
  const documents = useSelector(selectDocuments);

  const documentTypes = [
    { value: "OL_CERTIFICATE", label: "OL Certificate", required: true },
    { value: "AL_CERTIFICATE", label: "AL Certificate", required: true },
    {
      value: "BACHELORS_CERTIFICATE",
      label: "Bachelors Certificate",
      required: true,
    },
    { value: "PASSPORT", label: "Passport Copy", required: true },
    { value: "PHOTOGRAPH", label: "Photograph", required: true },
    { value: "CV", label: "Curriculum Vitae", required: true },
  ];

  // Store file in sessionStorage and return a reference ID
  const storeFile = (file: File): Promise<string> => {
    const fileId = `file_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Convert file to base64 for storage
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          data: reader.result, // base64 string
        };

        try {
          sessionStorage.setItem(fileId, JSON.stringify(fileData));
          resolve(fileId);
        } catch (error) {
          logger.error("Failed to store file:", error);
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsDataURL(file); // Convert to base64
    });
  };

  // Get file from sessionStorage
  const getFile = async (fileId: string): Promise<File | null> => {
    try {
      const fileDataStr = sessionStorage.getItem(fileId);
      if (!fileDataStr) return null;

      const fileData = JSON.parse(fileDataStr);

      // Convert base64 back to blob
      const response = await fetch(fileData.data);
      const blob = await response.blob();

      // Create File object
      return new File([blob], fileData.name, {
        type: fileData.type,
        lastModified: fileData.lastModified,
      });
    } catch (error) {
      logger.error("Failed to retrieve file:", error);
      return null;
    }
  };

  const handleFileSelect = useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement>,
      documentType: string
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file size
      if (file.size > APPLICATION_CONSTANTS.MAX_FILE_SIZE) {
        showToast.error(
          "File size exceeds 10MB limit. Please choose a smaller file."
        );
        event.target.value = "";
        return;
      }

      // Validate file type
      if (
        !APPLICATION_CONSTANTS.ALLOWED_FILE_TYPES.includes(file.type as any)
      ) {
        showToast.error(
          "Invalid file type. Please upload PDF, JPG, PNG, or DOC files only."
        );
        event.target.value = "";
        return;
      }

      try {
        // Store file in sessionStorage and get reference ID
        const fileId = await storeFile(file);

        // Create document object (serializable)
        const documentData = {
          documentType,
          fileName: file.name,
          filePath: fileId, // Use fileId as the file path reference
          fileSize: file.size,
          fileType: file.type,
          fileId, // Store only the reference ID
          uploadDate: new Date().toISOString(),
          url: "", // Will be filled after S3 upload
          verified: false,
        };

        logger.log("Storing document reference:", documentType, file.name);

        // Store serializable data in Redux
        dispatch(addDocument(documentData));
        showToast.success(`${file.name} uploaded successfully`);

        // Reset file input
        event.target.value = "";
      } catch (error) {
        logger.error("Error processing file:", error);
        showToast.error("Failed to process file. Please try again.");
      }
    },
    [dispatch]
  );

  const handleRemoveDocument = useCallback(
    (documentType: string) => {
      const doc = documents.find((d) => d.documentType === documentType);

      // Clean up sessionStorage
      if (doc?.fileId) {
        sessionStorage.removeItem(doc.fileId);
      }

      logger.log("Removing document:", documentType);
      dispatch(removeDocument(documentType));
      showToast.success("Document removed");
    },
    [dispatch, documents]
  );

  const getDocumentInfo = (documentType: string) => {
    return documents.find((doc) => doc.documentType === documentType);
  };

  // Check if document exists (either has fileId or url)
  const hasDocument = (documentType: string) => {
    const doc = getDocumentInfo(documentType);
    return !!(doc?.fileId || doc?.url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        📄 Upload Required Documents
      </h2>

      {/* Simple Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-800">Documents Status</h3>
            <p className="text-sm text-blue-700 mt-1">
              Files are stored in browser session
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-800">
              {documents.length} / {documentTypes.length}
            </div>
            <div className="text-sm text-blue-600">Documents ready</div>
          </div>
        </div>
      </div>

      {/* Simplified Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentTypes.map((docType) => {
          const document = getDocumentInfo(docType.value);
          const hasFile = hasDocument(docType.value);

          return (
            <div
              key={docType.value}
              className={`border rounded-lg p-4 ${
                hasFile
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">
                  {docType.label}
                  {docType.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </h3>
                <span
                  className={`text-sm font-medium ${
                    hasFile ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {hasFile ? "✅ Ready" : "📄 Required"}
                </span>
              </div>

              {hasFile ? (
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="mr-2">📎</span>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {document?.fileName || "Document"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {document?.fileSize
                                ? formatFileSize(document.fileSize)
                                : document?.url
                                ? "From S3"
                                : "N/A"}
                            </p>
                            {document?.url && !document?.fileId && (
                              <p className="text-xs text-blue-600 mt-1">
                                Click replace to download and edit
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDocument(docType.value)}
                        className="ml-3 text-red-600 hover:text-red-800"
                        title="Remove file"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <input
                    type="file"
                    id={`replace-${docType.value}`}
                    onChange={(e) => handleFileSelect(e, docType.value)}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label
                    htmlFor={`replace-${docType.value}`}
                    className="block w-full text-center py-2 border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                  >
                    Replace File
                  </label>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id={`file-${docType.value}`}
                    onChange={(e) => handleFileSelect(e, docType.value)}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label
                    htmlFor={`file-${docType.value}`}
                    className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                  >
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium">Choose File</p>
                        <p className="text-gray-500 text-sm mt-1">
                          PDF, JPG, PNG, DOC • Max 10MB
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Simple Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
        <p className="font-medium text-gray-700 mb-2">📌 How it works:</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-600">
          <li>Select files - they&apos;re stored in your browser session</li>
          <li>Complete all steps of the application</li>
          <li>Files will be uploaded to cloud storage when you submit</li>
          <li>Files will be cleared when you close the browser</li>
        </ol>
      </div>
    </div>
  );
};
