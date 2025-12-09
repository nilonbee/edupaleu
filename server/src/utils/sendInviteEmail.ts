import { sendEmail } from './sendEmail';

export const sendInviteEmail = async ({
  name,
  email,
  inviteToken,
  origin,
}: {
  name: string;
  email: string;
  inviteToken: string;
  origin: string;
}) => {
  const inviteUrl = `${origin}/invite?token=${inviteToken}`;

  const message = `<p>You have been invited to join EduPal. Please set up your account by clicking on the following link:</p>
  <p><a href="${inviteUrl}" style="background: linear-gradient(to right, rgb(6 182 212), rgb(37 99 235)); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 10px 0;">Set Up Account</a></p>
  <p>This link will expire in 7 days.</p>
  <p>If you didn't request this invitation, please ignore this email.</p>`;

  return sendEmail({
    to: email,
    subject: 'You\'ve been invited to EduPal',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello, ${name}</h2>
      ${message}
      <p style="margin-top: 30px; color: #666; font-size: 14px;">Best regards,<br>The EduPal Team</p>
    </div>`,
  });
};

