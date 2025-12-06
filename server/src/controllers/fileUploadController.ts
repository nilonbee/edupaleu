// controllers/fileUploadController.ts
import { Request, Response, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import upload from '../utils/upload';
import config from '../config';

const fileUpload: RequestHandler = async (req: Request, res: Response) => {
    try {
        const file = (req as any).files?.marriageCertificate;

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

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "File uploaded successfully",
            result,
        });

    } catch (error: any) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "File upload failed",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

export default fileUpload;
