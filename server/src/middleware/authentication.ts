import { Request, Response, NextFunction } from 'express';
import { UnauthenticatedError } from '../errors';
import { isTokenValid } from '../utils/jwt';
import { attachCookiesToResponse } from '../utils/jwt';
import prisma from '../lib/prisma';

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { refreshToken, accessToken } = (req as any).signedCookies;

  try {
    if (accessToken) {
      const payload = isTokenValid(accessToken);
      (req as any).user = payload.user;
      return next();
    }

    if (!refreshToken) {
      throw new UnauthenticatedError('Authentication Invalid');
    }

    const payload = isTokenValid(refreshToken);

    const existingToken = await prisma.authToken.findFirst({
      where: {
        userId: payload.user.userId,
        refreshToken: payload.refreshToken || '',
        isValid: true,
      },
    });

    if (!existingToken) {
      throw new UnauthenticatedError('Authentication Invalid');
    }

    attachCookiesToResponse({
      res,
      user: payload.user,
      refreshToken: existingToken.refreshToken,
    });

    (req as any).user = payload.user;
    next();
  } catch (error) {
    throw new UnauthenticatedError('Authentication Invalid');
  }
};

export const authorizePermissions = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as any).user?.role;

    if (!userRole || !roles.includes(userRole)) {
      throw new UnauthenticatedError('Unauthorized to access this route');
    }
    next();
  };
};

