// Email configuration pulled from environment variables.
// When EMAIL_USER/PASS are not set, sendEmail.ts will fall back
// to an auto-generated Ethereal account for local development.
const nodemailerConfig = {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
    },
};

export default nodemailerConfig;


