// utils/generateRef.ts
export const generateApplicationRef = (): string => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random

    return `APP${year}${month}${random}`;
};