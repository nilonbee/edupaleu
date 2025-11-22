import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Prisma } from '@prisma/client';
import CustomAPIError from '../errors/CustomAPIError';

export const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,

  next: NextFunction
): void => {
  let customError = {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong try again later',
  };

  if (err instanceof CustomAPIError && err.statusCode) {
    customError.statusCode = err.statusCode;
    customError.msg = err.message;
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    customError.msg = 'Validation Error';
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Prisma unique constraint errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      customError.msg = `Duplicate value entered for ${err.meta?.target} field, please choose another value`;
      customError.statusCode = StatusCodes.BAD_REQUEST;
    }
    if (err.code === 'P2025') {
      customError.msg = `No item found with the provided id`;
      customError.statusCode = StatusCodes.NOT_FOUND;
    }
  }

  res.status(customError.statusCode).json({ msg: customError.msg });
};

