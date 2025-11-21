import { StatusCodes } from 'http-status-codes';
import CustomAPIError from './CustomAPIError';

class UnauthorizedError extends CustomAPIError {
    statusCode: number;
    constructor(message: string) {
        super(message);
        this.statusCode = StatusCodes.FORBIDDEN;
    }
}

export default UnauthorizedError;

