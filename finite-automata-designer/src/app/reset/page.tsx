'use client';

import { useActionState } from 'react';
import { sendResetPasswordEmail } from '@/lib/actions';

export default function ResetPage() {
  const [state, formAction, isPending] = useActionState(sendResetPasswordEmail, {
    error: '',
    success: '',
  });

  const { error, success } = state;

  return (
    <main className="min-h-screen bg-blue-100 flex items-center justify-center">
      <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>

        <form
          action={formAction}
          className="flex flex-col gap-4"
        >
          {/* Email input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded hover:bg-black hover:shadow-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Sending…' : 'Send reset link'}
          </button>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
              {success}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
