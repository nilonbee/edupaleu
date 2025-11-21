import { StatusCodes } from 'http-status-codes';
import CustomAPIError from './CustomAPIError';

class UnauthenticatedError extends CustomAPIError {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

export default UnauthenticatedError;

