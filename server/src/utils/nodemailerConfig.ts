
const nodemailerConfig = {
    host: 'smtp.ethereal.email',
    port: parseInt('587', 10),
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
    },
};

export default nodemailerConfig;

