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
    // use sengrid for production
    const msg = {
      to,
      from: {
        name: 'Edupaleu Consultants',
        email: 'noreply@edupal.com'
      },
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
};