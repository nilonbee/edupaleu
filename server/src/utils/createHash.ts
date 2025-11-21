import crypto from 'crypto';

export const createHash = (string: string): string => {
  return crypto.createHash('md5').update(string).digest('hex');
};

