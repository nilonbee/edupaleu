import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
    BadRequestError,
    UnauthenticatedError,
    UnauthorizedError,
    NotFoundError,
} from '../errors';
import prisma from '../lib/prisma';
import { sendInviteEmail } from '../utils/sendInviteEmail';
import { createHash } from '../utils/createHash';

// Get all users (Admin only, Agents can see but limited)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const userRole = currentUser?.role;

    // Only admin and agent can access
    if (userRole !== 'admin' && userRole !== 'agent') {
        throw new UnauthorizedError('Unauthorized to access this route');
    }

    const { search, role, isActive } = req.query;

    const where: any = {};

    if (search) {
        where.OR = [
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
        ];
    }

    if (role) {
        const roleRecord = await prisma.role.findFirst({
            where: { name: role as string },
        });
        if (roleRecord) {
            where.roleId = roleRecord.id;
        }
    }

    if (isActive !== undefined) {
        where.isActive = isActive === 'true';
    }

    const users = await prisma.user.findMany({
        where,
        include: {
            role: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Format response
    const formattedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role.name,
        isActive: user.isActive,
        displayPicture: user.displayPicture,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        mustChangePassword: user.mustChangePassword,
    }));

    res.status(StatusCodes.OK).json({
        success: true,
        data: formattedUsers,
        count: formattedUsers.length,
    });
};

// Get single user
export const getSingleUser = async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
            role: true,
        },
    });

    if (!user) {
        throw new NotFoundError(`No user with id ${id}`);
    }

    // Users can see their own profile, admins can see all
    if (currentUser.userId !== user.id && currentUser.role !== 'admin' && currentUser.role !== 'agent') {
        throw new UnauthorizedError('Unauthorized to access this route');
    }

    const formattedUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role.name,
        isActive: user.isActive,
        displayPicture: user.displayPicture,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        mustChangePassword: user.mustChangePassword,
    };

    res.status(StatusCodes.OK).json({
        success: true,
        data: formattedUser,
    });
};

// Create user (Admin only)
export const createUser = async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;

    if (currentUser.role !== 'admin') {
        throw new UnauthorizedError('Only admins can create users');
    }

    const { email, firstName, lastName, phone, role: roleName = 'user', password } = req.body;

    if (!email || !firstName || !password) {
        throw new BadRequestError('Please provide email, firstName, and password');
    }

    const emailAlreadyExists = await prisma.user.findUnique({
        where: { email },
    });

    if (emailAlreadyExists) {
        throw new BadRequestError('Email already exists');
    }

    // Get role
    const role = await prisma.role.findFirst({
        where: { name: roleName },
    });

    if (!role) {
        throw new BadRequestError(`Role ${roleName} does not exist`);
    }

    // Hash password immediately (even if user must change it)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate invite token (7 days expiry)
    const inviteToken = crypto.randomBytes(40).toString('hex');
    const sevenDays = 1000 * 60 * 60 * 24 * 7;
    const inviteTokenExpirationDate = new Date(Date.now() + sevenDays);

    const user = await prisma.user.create({
        data: {
            email,
            firstName,
            lastName: lastName || '',
            phone,
            passwordHash,
            roleId: role.id,
            inviteToken: createHash(inviteToken),
            inviteTokenExpirationDate,
            mustChangePassword: true,
            isActive: true,
            isVerified: true, // Admin-created users don't need email verification
        },
        include: {
            role: true,
        },
    });

    // Send invite email
    const origin = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
        await sendInviteEmail({
            name: `${user.firstName} ${user.lastName}`.trim() || user.email,
            email: user.email,
            inviteToken: inviteToken, // Send plain token
            origin,
        });
    } catch (error) {
        console.error('Failed to send invite email:', error);
        // Don't fail user creation if email fails
    }

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'User created successfully. Invite email sent.',
        data: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role.name,
        },
    });
};

// Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { id } = req.params;
    const { firstName, lastName, phone, role: roleName, isActive, displayPicture } = req.body;

    const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
            role: true,
        },
    });

    if (!user) {
        throw new NotFoundError(`No user with id ${id}`);
    }

    // Permission checks
    const isAdmin = currentUser.role === 'admin';
    const isAgent = currentUser.role === 'agent';
    const isOwnProfile = currentUser.userId === user.id;

    // Users can only update their own basic info (not role, isActive)
    if (!isOwnProfile && !isAdmin && !isAgent) {
        throw new UnauthorizedError('Unauthorized to update this user');
    }

    // Only admin can change role, but admin and agent can change isActive
    if (roleName && !isAdmin) {
        // Agent can change users to agents
        if (isAgent && roleName === 'agent') {
            // Check if target user is currently admin
            if (user.role.name === 'admin') {
                throw new UnauthorizedError('Agents cannot change admin roles');
            }
            // Allow agent to change to agent
        } else {
            throw new UnauthorizedError('Only admins can change roles');
        }
    }
    
    // Only admin and agent can change isActive status
    if (isActive !== undefined && !isAdmin && !isAgent) {
        throw new UnauthorizedError('Only admins and agents can change user status');
    }

    const updateData: any = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (displayPicture !== undefined) updateData.displayPicture = displayPicture;

    // Role change
    if (roleName) {
        const role = await prisma.role.findFirst({
            where: { name: roleName },
        });
        if (!role) {
            throw new BadRequestError(`Role ${roleName} does not exist`);
        }
        updateData.roleId = role.id;
    }

    // Status change (admin and agent can change)
    if (isActive !== undefined && (isAdmin || isAgent)) {
        // Prevent deactivating the first admin (super admin)
        if (isActive === false && user.role.name === 'admin') {
            // Find the first admin (lowest ID with admin role)
            const firstAdmin = await prisma.user.findFirst({
                where: {
                    role: {
                        name: 'admin',
                    },
                },
                orderBy: {
                    id: 'asc',
                },
            });

            if (firstAdmin && firstAdmin.id === user.id) {
                throw new BadRequestError('Cannot deactivate the first admin account (super admin)');
            }
        }

        // Prevent admins from deactivating themselves
        if (isActive === false && isOwnProfile && user.role.name === 'admin') {
            throw new BadRequestError('You cannot deactivate your own admin account');
        }

        updateData.isActive = isActive;
    }

    const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
            role: true,
        },
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'User updated successfully',
        data: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phone: updatedUser.phone,
            role: updatedUser.role.name,
            isActive: updatedUser.isActive,
            displayPicture: updatedUser.displayPicture,
        },
    });
};

// Delete user (Admin only)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;

    if (currentUser.role !== 'admin') {
        throw new UnauthorizedError('Only admins can delete users');
    }

    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
    });

    if (!user) {
        throw new NotFoundError(`No user with id ${id}`);
    }

    // Prevent deleting yourself
    if (currentUser.userId === user.id) {
        throw new BadRequestError('You cannot delete your own account');
    }

    await prisma.user.delete({
        where: { id: parseInt(id) },
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'User deleted successfully',
    });
};

// Update own profile (Settings page)
export const updateCurrentUser = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;

    if (!userId) {
        throw new UnauthenticatedError('Not authenticated');
    }

    const { firstName, lastName, phone, displayPicture } = req.body;

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (displayPicture !== undefined) updateData.displayPicture = displayPicture;

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
            role: true,
        },
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phone: updatedUser.phone,
            displayPicture: updatedUser.displayPicture,
            role: updatedUser.role.name,
        },
    });
};

// Show current user
export const showMe = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;

    if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Unauthorized' });
        return;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            role: true,
        },
    });

    if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({ msg: 'User not found' });
        return;
    }

    const tokenUser = {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        displayPicture: user.displayPicture,
        mustChangePassword: user.mustChangePassword,
    };

    res.status(StatusCodes.OK).json({ user: tokenUser });
};

// Resend invite email to user
export const resendInviteEmail = async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;

    if (currentUser.role !== 'admin' && currentUser.role !== 'agent') {
        throw new UnauthorizedError('Only admins and agents can resend invite emails');
    }

    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
            role: true,
        },
    });

    if (!user) {
        throw new NotFoundError(`No user with id ${id}`);
    }

    // Generate new invite token (7 days expiry)
    const inviteToken = crypto.randomBytes(40).toString('hex');
    const sevenDays = 1000 * 60 * 60 * 24 * 7;
    const inviteTokenExpirationDate = new Date(Date.now() + sevenDays);

    // Update user with new invite token
    await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
            inviteToken: createHash(inviteToken),
            inviteTokenExpirationDate,
            mustChangePassword: true,
        },
    });

    // Send invite email
    const origin = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
        await sendInviteEmail({
            name: `${user.firstName} ${user.lastName}`.trim() || user.email,
            email: user.email,
            inviteToken: inviteToken, // Send plain token
            origin,
        });

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Invite email sent successfully',
        });
    } catch (error) {
        console.error('Failed to send invite email:', error);
        throw new BadRequestError('Failed to send invite email. Please try again.');
    }
};
