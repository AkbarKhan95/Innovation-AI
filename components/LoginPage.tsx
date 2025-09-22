import React, { useState } from 'react';
import type { User } from '../types';
import BotIcon from './icons/BotIcon';
import GoogleIcon from './icons/GoogleIcon';
import MicrosoftIcon from './icons/MicrosoftIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

// This helper function can live inside the component file as it's not used elsewhere.
const getInitials = (name: string): string => {
    const words = name.split(' ').filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

const generateAvatar = (name: string): string => {
    const initials = getInitials(name);
    
    // Simple hash function to get a consistent color for a given name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // A curated list of pleasant, modern colors
    const colors = [
        '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', 
        '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', 
        '#10b981', '#22c55e', '#84cc16', '#eab308', '#f97316', 
        '#ef4444',
    ];
    
    const color = colors[Math.abs(hash) % colors.length];

    // Create a simple SVG avatar
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="${color}" />
            <text x="50%" y="50%" font-family="Inter, system-ui, sans-serif" font-size="48" fill="#ffffff" text-anchor="middle" dy=".35em" font-weight="600">
                ${initials}
            </text>
        </svg>
    `.trim();

    // Return as a base64 encoded data URL
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};


const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'initial' | 'email' | 'code'>('initial');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    const name = 'Google User';
    onLogin({ name, email: 'google.user@example.com', picture: generateAvatar(name) });
  };

  const handleMicrosoftLogin = () => {
    const name = 'Microsoft User';
    onLogin({ name, email: 'ms.user@example.com', picture: generateAvatar(name) });
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('');
      // In a real app, this would be an API call to send the code.
      // For this demo, we generate it on the client.
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(randomCode);
      setStep('code');
    } else {
      setError('Please enter a valid email address.');
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === verificationCode) {
      setError('');
      // Generate a user-friendly name from the email
      const name = email.split('@')[0].replace(/[\._-]/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      const picture = generateAvatar(name);
      onLogin({ name, email, picture });
    } else {
      setError('Invalid verification code. Please try again.');
    }
  };
  
  const renderInitialStep = () => (
    <>
      <div className="hidden md:block text-center md:text-left">
        <h2 className="text-3xl font-bold mb-2 text-text-primary">Welcome Back</h2>
        <p className="text-text-secondary mb-8">Sign in to continue your journey of innovation.</p>
      </div>
      <div className="space-y-4">
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-bg-secondary border border-border-primary rounded-lg shadow-sm hover:bg-bg-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-primary text-text-primary"
        >
          <GoogleIcon />
          <span className="font-medium">Sign in with Google</span>
        </button>
        <button
          onClick={handleMicrosoftLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-bg-secondary border border-border-primary rounded-lg shadow-sm hover:bg-bg-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-primary text-text-primary"
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
        className="w-full py-3 px-4 bg-bg-accent text-text-on-accent rounded-lg shadow-md hover:bg-bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-primary font-medium"
      >
        Continue with Email
      </button>
    </>
  );

  const renderEmailStep = () => (
    <>
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-bold mb-2 text-text-primary">Enter your Email</h2>
        <p className="text-text-secondary mb-6">We'll send a verification code to sign you in.</p>
      </div>
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full p-3 bg-bg-input border border-border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-text-primary"
          required
          autoFocus
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-bg-accent text-text-on-accent rounded-lg shadow-md hover:bg-bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-primary font-medium"
        >
          Continue
        </button>
      </form>
    </>
  );

  const renderCodeStep = () => (
    <>
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-bold mb-2 text-text-primary">Check your Email</h2>
        <p className="text-text-secondary mb-2">We've sent a code to:</p>
        <p className="font-bold text-text-primary mb-6 break-all">{email}</p>
      </div>
      
      {/* For demonstration purposes, show the code on the screen */}
      <div className="p-3 mb-4 text-sm text-center bg-blue-500/10 text-blue-800 dark:text-blue-200 rounded-lg">
        For demonstration: your code is <strong className="font-bold">{verificationCode}</strong>
      </div>
      
      <form onSubmit={handleCodeSubmit} className="space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="______"
          className="w-full p-3 text-center tracking-[0.5em] font-mono text-lg bg-bg-input border border-border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-text-primary placeholder:tracking-widest"
          maxLength={6}
          required
          autoFocus
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-bg-accent text-text-on-accent rounded-lg shadow-md hover:bg-bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-primary font-medium"
        >
          Verify & Sign In
        </button>
      </form>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg-primary text-text-primary">
      {/* Branding Section (Left - hidden on mobile) */}
      <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-12 text-center">
        <BotIcon className="w-40 h-40 animate-float" />
        <h1 className="text-5xl font-bold mt-6">Innovation AI</h1>
        <p className="text-xl mt-4 opacity-80">Your dedicated partner in brainstorming and creative exploration.</p>
      </div>

      {/* Form Section (Right) */}
      <div className="flex flex-col justify-start md:justify-center w-full md:w-1/2 p-8 relative pt-20 md:pt-8">
        {step !== 'initial' && (
            <button onClick={() => setStep(step === 'code' ? 'email' : 'initial')} className="absolute top-6 left-6 p-2 rounded-full hover:bg-bg-tertiary transition-colors text-text-primary" aria-label="Go back">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
        )}
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Header */}
          <div className="md:hidden text-center mb-10">
            <BotIcon className="w-20 h-20 mx-auto text-blue-600 animate-float" />
            <h1 className="text-3xl font-bold mt-4 text-text-primary">Innovation AI</h1>
          </div>

          {step === 'initial' && renderInitialStep()}
          {step === 'email' && renderEmailStep()}
          {step === 'code' && renderCodeStep()}
          
          <p className="mt-8 text-xs text-text-secondary text-center">
            By signing in, you agree to our{' '}
            <a href="terms.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-text-primary transition-colors">
              terms of service
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;