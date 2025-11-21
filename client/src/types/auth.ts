export interface AuthFormData {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface AlertState {
    show: boolean;
    text: string;
    type: 'error' | 'success';
}