// hooks/useBatchUpload.ts
import { useUploadDocumentMutation } from '@/state/applicationApi';
import { getFileFromSessionStorage } from '@/utils/getFileFromSessionStorage';
import { logger } from '@/utils/logger';

export const useBatchUpload = () => {
    const [uploadDocument] = useUploadDocumentMutation();

    const batchUpload = async (files: Array<{
        fileId: string;
        documentType: string;
        fileName: string;
        studentId?: string;
    }>) => {
        const results = [];

        for (const item of files) {
            try {
                // Get file from sessionStorage
                const file = getFileFromSessionStorage(item.fileId);
                if (!file) {
                    results.push({
                        documentType: item.documentType,
                        success: false,
                        error: 'File not found in sessionStorage',
                        fileName: item.fileName
                    });
                    continue;
                }

                // Upload to S3
                const formData = new FormData();
                formData.append('document', file);
                formData.append('documentType', item.documentType);

                if (item.studentId) {
                    formData.append('studentId', item.studentId);
                }

                const response = await uploadDocument(formData).unwrap();

                // Handle different response structures
                // Backend returns: { success: true, message: "...", result: { Location, Key, ... } }
                const s3Location = response?.result?.Location || 
                                  response?.result?.location ||
                                  response?.Location ||
                                  response?.location;
                const s3Key = response?.result?.Key || 
                             response?.result?.key ||
                             response?.Key ||
                             response?.key;

                if (!s3Location) {
                    throw new Error('Upload succeeded but no URL returned');
                }

                results.push({
                    documentType: item.documentType,
                    success: true,
                    url: s3Location,
                    key: s3Key,
                    fileName: item.fileName
                });

            } catch (error: any) {
                logger.error(`Failed to upload ${item.documentType}:`, error);
                results.push({
                    documentType: item.documentType,
                    success: false,
                    error: error.message,
                    fileName: item.fileName
                });
            }
        }

        return results;
    };

    return { batchUpload };
};