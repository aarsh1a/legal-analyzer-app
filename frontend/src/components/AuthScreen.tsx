"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthScreenProps {
  onAuthSuccess?: () => void;
  className?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, className }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [signupData, setSignupData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loginErrors, setLoginErrors] = useState<Partial<LoginFormData>>({});
  const [signupErrors, setSignupErrors] = useState<Partial<SignupFormData>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateLoginForm = (): boolean => {
    const errors: Partial<LoginFormData> = {};
    
    if (!loginData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(loginData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!loginData.password) {
      errors.password = 'Password is required';
    }
    
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignupForm = (): boolean => {
    const errors: Partial<SignupFormData> = {};
    
    if (!signupData.name) {
      errors.name = 'Name is required';
    }
    
    if (!signupData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(signupData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!signupData.password) {
      errors.password = 'Password is required';
    } else if (signupData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (!signupData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (signupData.password !== signupData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: loginData.email,
        password: loginData.password,
        rememberMe: loginData.rememberMe,
        callbackURL: "/",
      });

      if (error?.code) {
        toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
        return;
      }

      toast.success("Welcome back! Redirecting...");
      onAuthSuccess?.();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    setIsLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        email: signupData.email,
        password: signupData.password,
        name: signupData.name,
      });

      if (error?.code) {
        const errorMap: Record<string, string> = {
          USER_ALREADY_EXISTS: "Email already registered. Please sign in instead.",
          INVALID_EMAIL: "Please enter a valid email address",
          WEAK_PASSWORD: "Password is too weak. Please choose a stronger password",
        };
        toast.error(errorMap[error.code] || "Registration failed. Please try again.");
        return;
      }

      toast.success("Account created successfully! Please check your email to verify your account.");
      setActiveTab('login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginChange = (field: keyof LoginFormData, value: string | boolean) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    if (loginErrors[field]) {
      setLoginErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSignupChange = (field: keyof SignupFormData, value: string) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
    if (signupErrors[field]) {
      setSignupErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 google-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-google-blue to-google-green rounded-full flex items-center justify-center mx-auto mb-4 google-pulse">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 font-google-sans mb-2">
            {activeTab === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gray-600 font-roboto">
            {activeTab === 'login' 
              ? 'Sign in to your account to continue' 
              : 'Join us and get started today'
            }
          </p>
        </div>

        {/* Auth Card */}
        <div className="google-card p-8 google-fade-in">
          {/* Tab Switcher */}
          <div className="flex border border-gray-200 rounded-lg p-1 mb-6 bg-gray-50">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-white text-google-blue shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'signup'
                  ? 'bg-white text-google-blue shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 font-google-sans">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => handleLoginChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg font-roboto transition-all duration-200 focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none ${
                      loginErrors.email
                        ? "border-google-red bg-red-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {loginErrors.email && (
                  <div className="flex items-center gap-2 mt-1">
                    <AlertCircle className="w-4 h-4 text-google-red" />
                    <span className="text-sm text-google-red font-roboto">{loginErrors.email}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 font-google-sans">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => handleLoginChange('password', e.target.value)}
                    autoComplete="off"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg font-roboto transition-all duration-200 focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none ${
                      loginErrors.password
                        ? "border-google-red bg-red-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginErrors.password && (
                  <div className="flex items-center gap-2 mt-1">
                    <AlertCircle className="w-4 h-4 text-google-red" />
                    <span className="text-sm text-google-red font-roboto">{loginErrors.password}</span>
                  </div>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={loginData.rememberMe}
                  onChange={(e) => handleLoginChange('rememberMe', e.target.checked)}
                  className="w-4 h-4 text-google-blue border-gray-300 rounded focus:ring-google-blue focus:ring-2"
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700 font-roboto">
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="google-primary-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="google-loading-dots">
                      <div className="w-2 h-2 rounded-full google-loading-dot dot-1"></div>
                      <div className="w-2 h-2 rounded-full google-loading-dot dot-2"></div>
                      <div className="w-2 h-2 rounded-full google-loading-dot dot-3"></div>
                      <div className="w-2 h-2 rounded-full google-loading-dot dot-4"></div>
                    </div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="w-5 h-5" />
                    <span>Sign in</span>
                  </div>
                )}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 font-google-sans">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signupData.name}
                    onChange={(e) => handleSignupChange('name', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg font-roboto transition-all duration-200 focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none ${
                      signupErrors.name
                        ? "border-google-red bg-red-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {signupErrors.name && (
                  <div className="flex items-center gap-2 mt-1">
                    <AlertCircle className="w-4 h-4 text-google-red" />
                    <span className="text-sm text-google-red font-roboto">{signupErrors.name}</span>
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 font-google-sans">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupData.email}
                    onChange={(e) => handleSignupChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg font-roboto transition-all duration-200 focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none ${
                      signupErrors.email
                        ? "border-google-red bg-red-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {signupErrors.email && (
                  <div className="flex items-center gap-2 mt-1">
                    <AlertCircle className="w-4 h-4 text-google-red" />
                    <span className="text-sm text-google-red font-roboto">{signupErrors.email}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 font-google-sans">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={signupData.password}
                    onChange={(e) => handleSignupChange('password', e.target.value)}
                    autoComplete="off"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg font-roboto transition-all duration-200 focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none ${
                      signupErrors.password
                        ? "border-google-red bg-red-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {signupErrors.password && (
                  <div className="flex items-center gap-2 mt-1">
                    <AlertCircle className="w-4 h-4 text-google-red" />
                    <span className="text-sm text-google-red font-roboto">{signupErrors.password}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 font-google-sans">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={signupData.confirmPassword}
                    onChange={(e) => handleSignupChange('confirmPassword', e.target.value)}
                    autoComplete="off"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg font-roboto transition-all duration-200 focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none ${
                      signupErrors.confirmPassword
                        ? "border-google-red bg-red-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {signupErrors.confirmPassword && (
                  <div className="flex items-center gap-2 mt-1">
                    <AlertCircle className="w-4 h-4 text-google-red" />
                    <span className="text-sm text-google-red font-roboto">{signupErrors.confirmPassword}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="google-primary-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="google-loading-dots">
                      <div className="w-2 h-2 rounded-full google-loading-dot dot-1"></div>
                      <div className="w-2 h-2 rounded-full google-loading-dot dot-2"></div>
                      <div className="w-2 h-2 rounded-full google-loading-dot dot-3"></div>
                      <div className="w-2 h-2 rounded-full google-loading-dot dot-4"></div>
                    </div>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Create Account</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 font-roboto">
            By {activeTab === 'login' ? 'signing in' : 'creating an account'}, you agree to our{' '}
            <a href="#" className="text-google-blue hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-google-blue hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};