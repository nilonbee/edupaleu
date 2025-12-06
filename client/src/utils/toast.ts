import toast from 'react-hot-toast';

/**
 * Centralized toast notification utility
 * Provides consistent toast messages throughout the application
 */

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      id: `success-${Date.now()}`,
    });
  },

  error: (message: string) => {
    toast.error(message, {
      id: `error-${Date.now()}`,
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      id: `loading-${Date.now()}`,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        duration: 4000,
      }
    );
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },
};

