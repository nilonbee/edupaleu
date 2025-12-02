export const cookieOptions = {
    httpOnly: true,
    secure: true,
    signed: true,
    sameSite: 'none' as const,
    path: '/',
};
