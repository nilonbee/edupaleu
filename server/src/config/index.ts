import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const config = {
    // App Configuration
    appname: 'edupaleu',
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,

    // Database
    database: {
        url: process.env.DATABASE_URL,
    },

    // JWT Authentication
    jwt: {
        secret: process.env.JWT_SECRET,
        lifetime: process.env.JWT_LIFETIME,
    },

    // AWS S3 Configuration
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
        s3BucketName: process.env.S3_BUCKET,
        uploadFolder: process.env.UPLOAD_FOLDER,
    },

    // Frontend/URLs
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
    },

    // Email Configuration
    email: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        sendgridApiKey: process.env.SENDGRID_API_KEY
    }
};

export default config;