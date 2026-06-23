import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import skyLogo from '../components/Sky.jpeg';

export const Login: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let finalEmail = email.trim();
    let finalPassword = password;

    // Initial Validations
    if (!finalEmail) {
      setErrorMsg('Please enter your business email address.');
      return;
    }
    if (!validateEmail(finalEmail)) {
      setErrorMsg('Please enter a valid business email address.');
      return;
    }
    if (!finalPassword) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate soft delay for premium security feel
      await new Promise((resolve) => setTimeout(resolve, 800));
      await login(finalEmail, finalPassword, rememberMe);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#DFFF4F]/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Visual background lines / ERP Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        {/* Branding Title */}
        <div className="flex flex-col items-center mb-8 text-center select-none">
          {/* Logo container with neon backglow */}
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#DFFF4F] p-1 shadow-[0_0_20px_rgba(223,255,79,0.3)] overflow-hidden mb-4 transition-transform hover:rotate-3">
            <img 
              src={skyLogo} 
              alt="SKY AUTOMATION TECH" 
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-black font-display tracking-wider text-white">
            SKY AUTOMATION TECH
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-bold uppercase tracking-widest text-[#DFFF4F]">
            Business Management & Sales Tracking System
          </p>
        </div>

        {/* Central Glassmorphic Card */}
        <div className="bg-[#0c0f17]/60 border border-white/10 rounded-[24px] p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">
          {/* Neon corner tabs */}
          <div className="absolute -top-px left-12 w-16 h-0.5 bg-[#DFFF4F] shadow-[0_0_10px_#DFFF4F]"></div>

          <div className="mb-6">
            <h2 className="text-xl font-extrabold font-display tracking-tight text-white">Welcome back</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Sign in to administer operational ledgers, real-time metrics, and item stocks.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* Error Indicator */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold leading-relaxed"
              >
                {errorMsg}
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email-input" className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                Business Email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full bg-[#111624]/80 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-650 focus:placeholder-slate-500 placeholder-slate-500 focus:outline-none focus:border-[#DFFF4F] focus:ring-1 focus:ring-[#DFFF4F] transition-all font-semibold font-sans"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password-input" className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-[10px] text-[#DFFF4F]/90 hover:text-[#DFFF4F] font-bold transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#111624]/80 border border-white/10 rounded-xl pl-11 pr-11 py-3 text-xs text-white placeholder-slate-650 placeholder-slate-500 focus:outline-none focus:border-[#DFFF4F] focus:ring-1 focus:ring-[#DFFF4F] transition-all font-semibold font-sans"
                />
                <button
                  id="btn-toggle-password"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  id="checkbox-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/10 text-[#DFFF4F] bg-[#111624] focus:ring-0 focus:ring-offset-0 w-4 h-4 accent-[#DFFF4F]"
                />
                <span className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors font-semibold">
                  Keep me signed in on this dev terminal
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-signin"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#DFFF4F] hover:bg-[#ebff85] disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none font-black text-black rounded-xl py-3 text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(223,255,79,0.25)] hover:shadow-[0_4px_25px_rgba(223,255,79,0.45)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating Account...</span>
                </>
              ) : (
                <span>Register / Sign In securely</span>
              )}
            </button>

          </form>
        </div>

        {/* Footer sign up redirect */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400 font-semibold">
            Deploying ERP for a new storefront?{' '}
            <Link to="/register" className="text-[#DFFF4F] hover:underline font-extrabold">
              Register Business Entity
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="text-center mt-12 text-[9px] text-slate-650 font-sans font-bold uppercase tracking-widest">
          <span>Sky Automation Tech © 2026</span>
        </div>
      </motion.div>
    </div>
  );
};
