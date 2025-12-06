import { logger } from './logger';

/**
 * Fetches a document from S3 URL directly
 * Stores it in sessionStorage and returns a fileId
 * If CORS prevents fetching, returns null and the URL will be used directly
 */
export const fetchS3Document = async (
  url: string,
  fileName: string,
  documentType: string
): Promise<string | null> => {
  try {
    // Fetch directly from S3 - same approach as other API calls
    // If S3 bucket has proper CORS configured, this will work
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors', // Explicitly request CORS
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    // Get the blob
    const blob = await response.blob();

    // Convert blob to base64 for storage
    const reader = new FileReader();
    const fileId = `s3_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const fileData = {
          name: fileName,
          type: blob.type || 'application/pdf',
          size: blob.size,
          lastModified: Date.now(),
          data: reader.result, // base64 string
          source: 's3', // Mark as from S3
          url, // Keep original URL
        };

        try {
          sessionStorage.setItem(fileId, JSON.stringify(fileData));
          resolve(fileId);
        } catch (error) {
          logger.error('Failed to store S3 file in sessionStorage:', error);
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsDataURL(blob); // Convert to base64
    });
  } catch (error: any) {
    // Handle CORS or network failures gracefully
    // If CORS fails, we'll just use the URL directly (no pre-loading to sessionStorage)
    if (error.message?.includes('CORS') || error.name === 'TypeError') {
      logger.warn(`S3 CORS not configured - using URL directly: ${url}`);
    } else {
      logger.warn(`Skipped fetching S3 document: ${url}`, error);
    }
    return null;
  }
};

/**
 * Batch fetch multiple S3 documents
 */
export const fetchS3Documents = async (
  documents: Array<{ url: string; fileName: string; documentType: string }>
): Promise<Array<{ documentType: string; fileId: string | null; fileName: string }>> => {
  const results = [];

  for (const doc of documents) {
    try {
      const fileId = await fetchS3Document(doc.url, doc.fileName, doc.documentType);
      results.push({
        documentType: doc.documentType,
        fileId,
        fileName: doc.fileName,
      });
    } catch (error) {
      logger.error(`Failed to fetch document ${doc.documentType}:`, error);
      // Continue with other documents even if one fails
    }
  }

  return results;
};

