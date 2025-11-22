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
  if (process.env.NODE_ENV === 'production') {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const msg = {
      to,
      from: process.env.EMAIL_FROM || 'nilonbee@gmail.com',
      subject,
      html,
    };

    return await sgMail.send(msg);
  } else {
    // Use Ethereal in development
    const transporter = nodemailer.createTransport(nodemailerConfig);
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Edupal" <noreply@edupal.com>',
      to,
      subject,
      html,
    });
    return result;
  }
};

