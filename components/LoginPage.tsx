import React, { useState } from 'react';
import type { User } from '../types';
import BotIcon from './icons/BotIcon';
import GoogleIcon from './icons/GoogleIcon';
import MicrosoftIcon from './icons/MicrosoftIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'initial' | 'email' | 'code'>('initial');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    onLogin({ name: 'Google User', email: 'google.user@example.com' });
  };

  const handleMicrosoftLogin = () => {
    onLogin({ name: 'Microsoft User', email: 'ms.user@example.com' });
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('');
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(randomCode);
      setStep('code');
    } else {
      setError('Please enter a valid email address.');
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would be validated against a backend service.
    if (code === verificationCode) {
      setError('');
      const name = email.split('@')[0].replace(/[\._-]/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      onLogin({ name, email });
    } else {
      setError('Invalid verification code. Please try again.');
    }
  };
  
  const renderInitialStep = () => (
    <>
      <p className="text-lg text-text-secondary mb-8">
        Welcome! Sign in to continue.
      </p>
      <div className="space-y-4">
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-bg-secondary border border-border-primary rounded-lg shadow-sm hover:bg-bg-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-secondary text-text-primary"
        >
          <GoogleIcon />
          <span className="font-medium">Sign in with Google</span>
        </button>
        <button
          onClick={handleMicrosoftLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-bg-secondary border border-border-primary rounded-lg shadow-sm hover:bg-bg-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-secondary text-text-primary"
        >
          <MicrosoftIcon />
          <span className="font-medium">Sign in with Microsoft</span>
        </button>
      </div>
      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-border-primary"></div>
        <span className="flex-shrink mx-4 text-text-secondary text-sm">OR</span>
        <div className="flex-grow border-t border-border-primary"></div>
      </div>
      <button 
        onClick={() => setStep('email')}
        className="w-full py-3 px-4 bg-bg-accent text-text-on-accent rounded-lg shadow-md hover:bg-bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-secondary font-medium"
      >
        Continue with Email
      </button>
    </>
  );

  const renderEmailStep = () => (
    <>
      <button onClick={() => setStep('initial')} className="absolute top-4 left-4 p-2 rounded-full hover:bg-bg-tertiary transition-colors text-text-primary" aria-label="Go back">
        <ArrowLeftIcon className="w-6 h-6" />
      </button>
      <p className="text-lg text-text-secondary mb-6">
        Enter your email to sign in.
      </p>
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full p-3 bg-bg-input border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-text-primary"
          required
          autoFocus
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-bg-accent text-text-on-accent rounded-lg shadow-md hover:bg-bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-secondary font-medium"
        >
          Continue
        </button>
      </form>
    </>
  );

  const renderCodeStep = () => (
    <>
      <button onClick={() => setStep('email')} className="absolute top-4 left-4 p-2 rounded-full hover:bg-bg-tertiary transition-colors text-text-primary" aria-label="Go back">
        <ArrowLeftIcon className="w-6 h-6" />
      </button>
       <p className="text-lg text-text-secondary mb-2">
        Enter the code we sent to:
      </p>
      <p className="font-bold text-text-primary mb-6 break-all">{email}</p>
      
      <div className="p-3 mb-4 text-sm text-center bg-blue-500/10 text-blue-800 dark:text-blue-200 rounded-lg">
        For demonstration: your code is <strong className="font-bold">{verificationCode}</strong>
      </div>
      
      <form onSubmit={handleCodeSubmit} className="space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={verificationCode}
          className="w-full p-3 text-center tracking-[0.5em] font-mono text-lg bg-bg-input border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-text-primary"
          maxLength={6}
          required
          autoFocus
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-bg-accent text-text-on-accent rounded-lg shadow-md hover:bg-bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-secondary font-medium"
        >
          Verify & Sign In
        </button>
      </form>
    </>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary text-text-primary p-4">
      <div className="w-full max-w-sm text-center bg-bg-secondary p-8 rounded-2xl shadow-2xl relative backdrop-blur-lg border border-border-primary">
        <BotIcon className="w-20 h-20 mx-auto text-blue-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-text-primary">Innovation AI</h1>
        
        {step === 'initial' && renderInitialStep()}
        {step === 'email' && renderEmailStep()}
        {step === 'code' && renderCodeStep()}
        
        <p className="mt-8 text-xs text-text-secondary">
          By signing in, you agree to our{' '}
          <a href="terms.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-text-primary transition-colors">
            terms of service
          </a>.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;