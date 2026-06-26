import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ShieldCheck, KeyRound, ArrowLeft, RefreshCw, Key, CheckCircle, ShieldAlert, Lock, Check } from 'lucide-react';
import skyLogo from '../components/Sky.jpeg';

export const ForgotPassword: React.FC = () => {
  const { resetPassword } = useApp();
  const navigate = useNavigate();

  // Wizard steps: 'request' | 'completed'
  const [step, setStep] = useState<'request' | 'completed'>('request');

  // Fields state
  const [email, setEmail] = useState('');

  // Status controls
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  // Submit Reset request to dispatch secure Firebase password reset link
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !validateEmail(email)) {
      setErrorMsg('Please specify a valid registered corporate Gmail address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setStep('completed');
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification email delivery failure.');
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        {/* Branding header */}
        <div className="flex flex-col items-center mb-6 text-center select-none">
          <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#DFFF4F] p-1 shadow-[0_0_20px_rgba(223,255,79,0.25)] overflow-hidden mb-3">
            <img 
              src={skyLogo} 
              alt="SKY AUTOMATION TECH" 
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-lg font-black font-display tracking-wider text-white">
            SKY AUTOMATION TECH
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest text-[#DFFF4F]">
            Business Management &amp; Sales Tracking System
          </p>
        </div>

        {/* Central Card Container */}
        <div className="bg-[#0c0f17]/60 border border-white/10 rounded-[24px] p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">
          <div className="absolute -top-px left-12 w-16 h-0.5 bg-[#DFFF4F] shadow-[0_0_10px_#DFFF4F]"></div>

          <AnimatePresence mode="wait">
            
            {step === 'request' && (
              <motion.div
                key="step-request"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-lg font-extrabold font-display tracking-tight text-white">Reset Credentials</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">
                    Enter the corporate Gmail associated with your storefront. We will route a secure password reset link to restore clearance.
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
                  {errorMsg && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold leading-relaxed">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="email-recovery" className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      Business Gmail Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 animate-pulse">
                        <Mail className="w-4 h-4 text-[#DFFF4F]" />
                      </div>
                      <input
                        id="email-recovery"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ceo@skyautomation.com"
                        className="w-full bg-[#111624]/80 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DFFF4F] focus:ring-1 focus:ring-[#DFFF4F] transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-send-code"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#DFFF4F] hover:bg-[#ebff85] disabled:bg-slate-800 disabled:text-slate-500 font-black text-black rounded-xl py-3 text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(223,255,79,0.2)] hover:shadow-[0_4px_25px_rgba(223,255,79,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-black animate-none shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Sending Reset Link...</span>
                      </>
                    ) : (
                      'Request Reset Link'
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'completed' && (
              <motion.div
                key="step-completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-6 space-y-5"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#DFFF4F]/10 border border-[#DFFF4F]/30 flex items-center justify-center text-[#DFFF4F] shadow-[0_0_20px_rgba(223,255,79,0.3)] select-none">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl font-black font-display text-white">Reset Link Dispatched</h2>
                  <p className="text-[11.5px] text-slate-400 font-semibold leading-relaxed">
                    A secure password reset link has been dispatched to your email address. Please follow the instructions in the email to set a new password, then return here to login.
                  </p>
                </div>

                <button
                  id="btn-return-to-login"
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#DFFF4F] hover:bg-[#ebff85] font-black text-black rounded-xl py-3 text-xs text-center uppercase tracking-wider shadow-[0_4px_20px_rgba(223,255,79,0.15)] cursor-pointer"
                >
                  Return to Sign In
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Back Link to login */}
        {step !== 'completed' && (
          <div className="text-center mt-6">
            <Link 
              to="/login" 
              className="text-xs text-slate-500 hover:text-[#DFFF4F] font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
            </Link>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center mt-12 text-[9px] text-slate-650 font-sans font-bold uppercase tracking-widest">
          <span>Sky Automation Tech © 2026</span>
        </div>
      </motion.div>
    </div>
  );
};
