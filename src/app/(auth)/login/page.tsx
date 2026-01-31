'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'magic-link' | 'password';
type PasswordAction = 'sign-in' | 'sign-up';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [passwordAction, setPasswordAction] = useState<PasswordAction>('sign-in');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email! We sent you a magic link to sign in.',
      });
      setEmail('');
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    if (!password) {
      setMessage({ type: 'error', text: 'Please enter your password' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    if (passwordAction === 'sign-up' && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const supabase = createClient();

    if (passwordAction === 'sign-up') {
      // Sign up with email and password
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      setIsLoading(false);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({
          type: 'success',
          text: 'Account created! Check your email to confirm your account.',
        });
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } else {
      // Sign in with email and password
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      setIsLoading(false);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        // Redirect to generate page on successful login
        router.push('/generate');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-white">D</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">DICE</h1>
          <p className="mt-2 text-gray-600">
            Decision Intelligence Content Evaluator
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Test and compare AI models for marketing content
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setAuthMode('password')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authMode === 'password'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('magic-link')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authMode === 'magic-link'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Magic Link
          </button>
        </div>

        {authMode === 'magic-link' ? (
          // Magic Link Form
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email-magic" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email-magic"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending magic link...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Send magic link
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              We&apos;ll send you a secure link to sign in - no password needed
            </p>
          </form>
        ) : (
          // Password Form
          <form onSubmit={handlePasswordAuth} className="space-y-4">
            {/* Sign In / Sign Up Toggle */}
            <div className="flex rounded-lg border border-gray-200 p-1">
              <button
                type="button"
                onClick={() => {
                  setPasswordAction('sign-in');
                  setMessage(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  passwordAction === 'sign-in'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordAction('sign-up');
                  setMessage(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  passwordAction === 'sign-up'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div>
              <label htmlFor="email-password" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email-password"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            {passwordAction === 'sign-up' && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            )}

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {passwordAction === 'sign-up' ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  {passwordAction === 'sign-up' ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              {passwordAction === 'sign-up'
                ? 'Create an account with your email and password'
                : 'Sign in with your email and password'}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
