// controllers/fileUploadController.ts
import { Request, Response, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import upload from '../utils/upload';
import config from '../config';

const fileUpload: RequestHandler = async (req: Request, res: Response) => {
    try {
        // Check for different field names based on document type
        const documentType = (req as any).body?.documentType;
        let file;

        if (documentType === 'USER_DISPLAY_PICTURE') {
            // For display pictures, accept either 'file' or 'marriageCertificate' field
            file = (req as any).files?.file || (req as any).files?.marriageCertificate;
        } else {
            // For other documents, use marriageCertificate field
            file = (req as any).files?.marriageCertificate || (req as any).files?.file;
        }


        if (!file) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "No file provided"
            });
        }

        if (!config.aws.s3BucketName) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "S3 bucket configuration is missing"
            });
        }

        const result = await upload(file, config.aws.s3BucketName);

        // Extract URL from S3 result
        const fileUrl = result.Location || result.url;

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "File uploaded successfully",
            url: fileUrl,
            filePath: fileUrl,
            result,
        });

    } catch (error: any) {
        console.error('File upload error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "File upload failed",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

export default fileUpload;
