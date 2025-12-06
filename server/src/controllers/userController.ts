import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createTokenUser } from '../utils/createTokenUser';
import prisma from '../lib/prisma';

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

  const tokenUser = createTokenUser(user);
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

