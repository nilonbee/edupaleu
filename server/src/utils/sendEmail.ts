import nodemailer from 'nodemailer';
import nodemailerConfig from './nodemailerConfig';

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  const transporter = nodemailer.createTransport(nodemailerConfig);

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Edupal" <noreply@edupal.com>',
    to,
    subject,
    html,
  });
};

