'use client';

import { useFormStatus } from 'react-dom';
import { authenticate } from './actions';
import { useActionState } from 'react';

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Login to Benotes</h1>
        <form action={dispatch} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username (Tenant ID)</label>
            <input
              name="username"
              type="text"
              required
              className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border"
              placeholder="Any password"
            />
          </div>
          <LoginButton />
          {errorMessage && (
            <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? 'Logging in...' : 'Login'}
    </button>
  );
}
