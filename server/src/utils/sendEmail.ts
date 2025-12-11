import nodemailer from 'nodemailer';
import nodemailerConfig from './nodemailerConfig';
import sgMail from '@sendgrid/mail';

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.SENDGRID_API_KEY) {
        console.error('SENDGRID_API_KEY is not set. Email sending skipped.');
        return null;
      }

      // Set API key (SendGrid caches this, but setting it multiple times is safe)
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      // Use verified sender email from SendGrid
      // IMPORTANT: The 'from' email must be verified in your SendGrid account
      // You can use either:
      // 1. A verified single sender: 'verified-email@yourdomain.com'
      // 2. Or use the format: { name: 'Display Name', email: 'verified-email@yourdomain.com' }
      const msg = {
        to,
        from: 'nilonbee@gmail.com', // Use verified email
        subject,
        html,
      };

      console.log('Sending email via SendGrid to:', to);
      const result = await sgMail.send(msg);
      console.log('Email sent successfully:', result[0]?.statusCode);
      return result;
    } else {
      // Use Ethereal in development
      const transporter = nodemailer.createTransport(nodemailerConfig);
      const result = await transporter.sendMail({
        from: '"Edupal" <noreply@edupal.com>',
        to,
        subject,
        html,
      });
      return result;
    }
  } catch (error: any) {
    // Log detailed error for debugging
    console.error('Failed to send email:', {
      message: error.message,
      code: error.code,
      response: error.response?.body || error.response,
      statusCode: error.response?.statusCode,
    });

    // Log specific SendGrid errors
    if (error.response?.body) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body, null, 2));
    }

    return null;
  }
};