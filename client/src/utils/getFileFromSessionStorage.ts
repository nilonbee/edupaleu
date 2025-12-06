// utils/fileStorage.ts
import { logger } from './logger';

export const getFileFromSessionStorage = (fileId: string): File | null => {
    try {
        const fileDataStr = sessionStorage.getItem(fileId);
        if (!fileDataStr) {
            logger.warn(`File not found in sessionStorage: ${fileId}`);
            return null;
        }

        const fileData = JSON.parse(fileDataStr);

        // Convert base64 to blob
        const byteString = atob(fileData.data.split(',')[1]);
        const mimeString = fileData.data.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([ab], { type: mimeString });

        // Create File object
        return new File([blob], fileData.name, {
            type: fileData.type,
            lastModified: fileData.lastModified || Date.now(),
        });
    } catch (error) {
        logger.error('Error retrieving file from sessionStorage:', error);
        return null;
    }
};

// Helper to store file in sessionStorage
export const storeFileInSessionStorage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            try {
                const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const fileData = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified,
                    data: reader.result as string
                };

                sessionStorage.setItem(fileId, JSON.stringify(fileData));
                resolve(fileId);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};

// Clean up files from sessionStorage
export const cleanupSessionStorage = (fileIds: string[]) => {
    fileIds.forEach(fileId => {
        try {
            sessionStorage.removeItem(fileId);
        } catch (error) {
            logger.warn(`Failed to remove file ${fileId} from sessionStorage:`, error);
        }
    });
};

// Remove any previously stored application files to avoid stale uploads
export const clearAllSessionFiles = () => {
    try {
        const keys: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('file_')) {
                keys.push(key);
            }
        }
        cleanupSessionStorage(keys);
    } catch (error) {
        logger.warn('Failed to clear sessionStorage file cache:', error);
    }
};