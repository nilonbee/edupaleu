import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
    BadRequestError,
    UnauthenticatedError,
} from '../errors';
import { cookieOptions } from '../utils/cookieOptions';
import { attachCookiesToResponse } from '../utils/jwt';
import { createTokenUser } from '../utils/createTokenUser';
import { sendVerificationEmail } from '../utils/sendVerificationEmail';
import { sendResetPasswordEmail } from '../utils/sendResetPasswordEmail';
import { createHash } from '../utils/createHash';
import prisma from '../lib/prisma';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, firstName, lastName, password } = req.body;

        if (!email || !firstName || !lastName || !password) {
            throw new BadRequestError('Please provide all required fields');
        }

        const emailAlreadyExists = await prisma.user.findUnique({
            where: { email },
        });

        if (emailAlreadyExists) {
            throw new BadRequestError('Email already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Check if this is the first user (make them admin)
        const userCount = await prisma.user.count();
        const roleName = userCount === 0 ? 'admin' : 'user';

        // Get or create the role
        let userRole = await prisma.role.findFirst({
            where: { name: roleName },
        });

        if (!userRole) {
            // Create the role if it doesn't exist
            userRole = await prisma.role.create({
                data: {
                    name: roleName,
                    description: `${roleName} role`,
                    permissions: {},
                    isActive: true,
                },
            });
        }

        const verificationToken = crypto.randomBytes(40).toString('hex');

        const user = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                passwordHash,
                roleId: userRole.id,
                verificationToken,
                isVerified: false,
            },
            include: {
                role: true,
            },
        });

        const origin = process.env.FRONTEND_URL || 'http://localhost:3000';

        // Send verification email (non-blocking - don't fail registration if email fails)
        sendVerificationEmail({
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            verificationToken: user.verificationToken!,
            origin,
        }).catch((error) => {
            // Log error but don't fail the registration
            console.error('Failed to send verification email:', error);
        });

        res.status(StatusCodes.CREATED).json({
            msg: 'Success! Please check your email to verify account',
        });
    } catch (error: any) {
        // Log the full error for debugging
        console.error('Registration error:', error);
        // Re-throw to let error handler middleware handle it
        throw error;
    }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const { verificationToken, email } = req.body;

    if (!verificationToken || !email) {
        throw new BadRequestError('Please provide verification token and email');
    }

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new UnauthenticatedError('Verification Failed');
    }

    if (user.verificationToken !== verificationToken) {
        throw new UnauthenticatedError('Verification Failed');
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verified: new Date(),
            verificationToken: null,
        },
    });

    res.status(StatusCodes.OK).json({ msg: 'Email Verified' });
};

// Setup password from invite
export const setupPasswordFromInvite = async (req: Request, res: Response): Promise<void> => {
    const { token, password } = req.body;

    if (!token || !password) {
        throw new BadRequestError('Please provide token and password');
    }

    const hashedToken = createHash(token);

    const user = await prisma.user.findFirst({
        where: {
            inviteToken: hashedToken,
            inviteTokenExpirationDate: {
                gte: new Date(),
            },
        },
    });

    if (!user) {
        throw new UnauthenticatedError('Invalid or expired invite token');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password and clear invite token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            inviteToken: null,
            inviteTokenExpirationDate: null,
            mustChangePassword: false,
            isVerified: true, // Auto-verify when setting password from invite
        },
    });

    res.status(StatusCodes.OK).json({ msg: 'Password set successfully. You can now login.' });
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new BadRequestError('Please provide email and password');
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            role: true,
        },
    });

    if (!user) {
        throw new UnauthenticatedError('Invalid Credentials');
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordCorrect) {
        throw new UnauthenticatedError('Invalid Credentials');
    }

    if (!user.isVerified) {
        throw new UnauthenticatedError('Please verify your email');
    }

    if (!user.isActive) {
        throw new UnauthenticatedError('Account is inactive. Please contact administrator.');
    }

    // Check if user must change password
    if (user.mustChangePassword) {
        res.status(StatusCodes.OK).json({
            user: null,
            mustChangePassword: true,
            message: 'Please change your password',
        });
        return;
    }

    const tokenUser = createTokenUser(user);

    // Check for existing token
    const existingToken = await prisma.authToken.findFirst({
        where: { userId: user.id },
    });

    let refreshToken = '';

    if (existingToken && existingToken.isValid) {
        refreshToken = existingToken.refreshToken;
        attachCookiesToResponse({ res, user: tokenUser, refreshToken });
        res.status(StatusCodes.OK).json({ user: tokenUser });
        return;
    }

    // Create new refresh token
    refreshToken = crypto.randomBytes(40).toString('hex');
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.socket.remoteAddress || '';

    await prisma.authToken.create({
        data: {
            refreshToken,
            ip,
            userAgent,
            userId: user.id,
            isValid: true,
        },
    });

    attachCookiesToResponse({ res, user: tokenUser, refreshToken });

    // Update last login
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
    });

    res.status(StatusCodes.OK).json({ user: tokenUser });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        // Try to get user ID if available, but don't require it
        const userId = (req as any).user?.userId;

        console.log('user_id', userId);

        if (userId) {
            await prisma.authToken.deleteMany({
                where: { userId },
            });
        }

        // Clear cookies regardless
        res.cookie('accessToken', 'logout', {
            ...cookieOptions,
            expires: new Date(Date.now()),
        });
        res.cookie('refreshToken', 'logout', {
            ...cookieOptions,
            expires: new Date(Date.now()),
        });

        res.status(StatusCodes.OK).json({ msg: 'User logged out successfully!' });
    } catch (error) {
        // Still clear cookies even if there's an error
        res.cookie('accessToken', 'logout', {
            ...cookieOptions,
            expires: new Date(Date.now()),
        });
        res.cookie('refreshToken', 'logout', {
            ...cookieOptions,
            expires: new Date(Date.now()),
        });

        res.status(StatusCodes.OK).json({ msg: 'User logged out!' });
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
        throw new BadRequestError('Please provide valid email');
    }

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        const passwordToken = crypto.randomBytes(70).toString('hex');
        const origin = process.env.FRONTEND_URL || 'http://localhost:3000';

        await sendResetPasswordEmail({
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            token: passwordToken,
            origin,
        });

        const tenMinutes = 1000 * 60 * 10;
        const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordToken: createHash(passwordToken),
                passwordTokenExpirationDate,
            },
        });
    }

    res.status(StatusCodes.OK).json({
        msg: 'Please check your email for reset password link',
    });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
        throw new BadRequestError('Please provide all values');
    }

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        const currentDate = new Date();

        if (
            user.passwordToken === createHash(token) &&
            user.passwordTokenExpirationDate &&
            user.passwordTokenExpirationDate > currentDate
        ) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    passwordToken: null,
                    passwordTokenExpirationDate: null,
                    mustChangePassword: false,
                },
            });

            res.status(StatusCodes.OK).json({ msg: 'Password reset successful' });
            return;
        }
    }

    throw new BadRequestError('Invalid or expired reset token');
};
