import AWS from 'aws-sdk';
import config from '../config';

const upload = async (file: any, bucketName: string): Promise<any> => {
    if (!file || !file.data) {
        throw new Error('Invalid file object provided');
    }

    if (!bucketName) {
        throw new Error('Bucket name is required');
    }

    try {
        const s3 = new AWS.S3({
            credentials: {
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretKey,
            },
            region: config.aws.region,
        });

        // Sanitize filename and create unique name
        const sanitizedFileName = file.name
            ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200)
            : 'document';

        const tempFileName = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}_${sanitizedFileName}`;

        const params: AWS.S3.PutObjectRequest = {
            Bucket: bucketName,
            Key: `uploads/${tempFileName}`,
            Body: file.data,
            ContentType: file.mimetype || 'application/octet-stream',
            // Add metadata
            Metadata: {
                originalName: sanitizedFileName,
                uploadedAt: new Date().toISOString(),
            },
        };

        return new Promise((resolve, reject) => {
            s3.upload(params, {}, (err, data) => {
                if (err) {
                    reject(new Error(`S3 upload failed: ${err.message}`));
                } else {
                    resolve(data);
                }
            });
        });
    } catch (error: any) {
        throw new Error(`File upload error: ${error.message}`);
    }
};

export default upload;