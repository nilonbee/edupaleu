interface User {
  id: number;
  firstName: string;
  lastName: string;
  roleId: number;
  role?: {
    name: string;
  };
}

export const createTokenUser = (user: User) => {
  return {
    name: `${user.firstName} ${user.lastName}`,
    userId: user.id,
    role: user.role?.name || 'user',
  };
};

