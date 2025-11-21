'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useResetPasswordMutation } from '@/state/api';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resetPassword, { isLoading, isError, error }] = useResetPasswordMutation();
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState({ show: false, text: '', type: 'error' as 'error' | 'success' });
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setAlert({ show: true, text: 'Please enter password', type: 'error' });
      return;
    }
    try {
      await resetPassword({
        password,
        token: searchParams.get('token') || '',
        email: searchParams.get('email') || '',
      }).unwrap();
      setSuccess(true);
      setAlert({
        show: true,
        text: 'Success, redirecting to login page shortly',
        type: 'success',
      });
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      const errorMessage = err?.data?.msg || 'An error occurred';
      setAlert({ show: true, text: errorMessage, type: 'error' });
    }
  };

  useEffect(() => {
    if (isError && error) {
      const errorMessage = 'data' in error ? (error.data as any)?.msg : 'An error occurred';
      setAlert({ show: true, text: errorMessage, type: 'error' });
    }
  }, [isError, error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {alert.show && (
          <div
            className={`p-4 rounded-md ${
              alert.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {alert.text}
          </div>
        )}
        {!success && (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Reset password
              </h2>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="sr-only">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="New Password"
                  value={password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Please Wait...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

