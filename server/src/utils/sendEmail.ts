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
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // use sengrid for production
      const msg = {
        to,
        from: 'noreply@edupaleu.com',
        subject,
        html,
      };

      return await sgMail.send(msg);
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
  } catch (error) {
    // Log error but don't throw - allow registration to succeed even if email fails
    console.error('Failed to send email:', error);
    return null;
  }
};