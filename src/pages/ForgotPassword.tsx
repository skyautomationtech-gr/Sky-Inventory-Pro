import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ShieldCheck, KeyRound, ArrowLeft, RefreshCw, Key, CheckCircle, ShieldAlert, Lock, Check } from 'lucide-react';
import skyLogo from '../components/Sky.jpeg';
import { SandboxInbox } from '../components/SandboxInbox';

export const ForgotPassword: React.FC = () => {
  const { sendResetOTP, verifyOTP, completeOTPPasswordReset } = useApp();
  const navigate = useNavigate();

  // Wizard steps: 'request' | 'otp' | 'reset-credentials' | 'completed'
  const [step, setStep] = useState<'request' | 'otp' | 'reset-credentials' | 'completed'>('request');

  // Fields state
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifiedOtpSessionCode, setVerifiedOtpSessionCode] = useState('');

  // Status controls
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // OTP arrays
  const [otpArray, setOtpArray] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown clock loop
  useEffect(() => {
    if (step === 'otp' && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, countdown]);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  // Step 1: Submit Reset request to dispatch OTP code
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !validateEmail(email)) {
      setErrorMsg('Please specify a valid registered corporate Gmail address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendResetOTP(email);
      setStep('otp');
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification email delivery failure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Handle single digit keypress and focus controls
  const handleOtpInput = (index: number, val: string) => {
    const cleanValue = val.slice(-1);
    if (/[^0-9]/.test(cleanValue) && cleanValue !== '') return;

    const updated = [...otpArray];
    updated[index] = cleanValue;
    setOtpArray(updated);

    if (cleanValue !== '' && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otpArray[index] === '' && index > 0) {
      const updated = [...otpArray];
      updated[index - 1] = '';
      setOtpArray(updated);
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedText) return;

    const updated = [...otpArray];
    for (let i = 0; i < 6; i++) {
      updated[i] = pastedText[i] || '';
    }
    setOtpArray(updated);

    const matchIdx = Math.min(pastedText.length, 5);
    otpRefs[matchIdx].current?.focus();
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg(null);
    setCountdown(60);
    setCanResend(false);

    try {
      await sendResetOTP(email);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch new OTP.');
    }
  };

  // Step 3: Verify input code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const codeStr = otpArray.join('');
    if (codeStr.length < 6) {
      setErrorMsg('Enter the complete 6-digit authorization key.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOTP(email, codeStr, 'reset');
      setVerifiedOtpSessionCode(codeStr);
      setStep('reset-credentials');
    } catch (err: any) {
      setErrorMsg(err.message || 'Code validation issue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Finalize Reset & Apply New Credentials
  const handleFinalSubmitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('The new password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOTPPasswordReset(email, verifiedOtpSessionCode, newPassword);
      setStep('completed');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed updating authorization credentials.');
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
                    Enter the corporate Gmail associated with your storefront. We will route a secure 6-digit verification code to restore clearance.
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
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-505 text-slate-500 animate-pulse">
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
                        <span>Requesting Authorization...</span>
                      </>
                    ) : (
                      'Request Verification OTP'
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="step-otp-verification"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-black font-display tracking-tight text-white">Enter credentials OTP</h2>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    A validation code has been routed to:
                    <span className="block text-[#DFFF4F] font-bold mt-0.5 font-mono select-all">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 mt-0.5 text-rose-450 shrink-0 text-rose-400" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Code Entry boxes */}
                  <div className="flex gap-2 justify-between items-center" id="otp-inputs-grid-reset">
                    {otpArray.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={otpRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        value={digit}
                        onChange={(e) => handleOtpInput(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-14 bg-[#111624]/80 text-xl font-mono border border-white/10 rounded-xl text-center text-white focus:outline-none focus:border-[#DFFF4F] focus:ring-1 focus:ring-[#DFFF4F] font-extrabold focus:scale-105 transition-all"
                      />
                    ))}
                  </div>

                  {/* Verification helpers */}
                  <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-slate-400 leading-relaxed font-semibold">
                    Open your simulated mailbox gateway to acquire the current password reset authorization OTP code instantly.
                  </div>

                  <button
                    id="btn-verify-otp-reset"
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
                        <span>Authenticating Code...</span>
                      </>
                    ) : (
                      'Verify Code & Proceed'
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      id="btn-trigger-resend-reset"
                      type="button"
                      disabled={!canResend}
                      onClick={handleResendOtp}
                      className="text-[11px] font-bold text-slate-400 hover:text-[#DFFF4F] disabled:text-slate-600 disabled:hover:text-slate-600 font-mono tracking-wide transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${!canResend ? '' : 'animate-pulse'}`} />
                      {canResend ? 'Resend reset OTP' : `Resend code in (${countdown}s)`}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep('request');
                        setOtpArray(['', '', '', '', '', '']);
                        setErrorMsg(null);
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-white transition-all cursor-pointer"
                    >
                      Alter email address
                    </button>
                  </div>

                </form>

                {/* Render integrated SandboxInbox */}
                <SandboxInbox email={email} />
              </motion.div>
            )}

            {step === 'reset-credentials' && (
              <motion.div
                key="step-reset-credentials"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-black font-display tracking-tight text-white">New Credentials</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Create strong authorization credentials to secure your business storefront registry.
                  </p>
                </div>

                <form onSubmit={handleFinalSubmitReset} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold leading-relaxed">
                      {errorMsg}
                    </div>
                  )}

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="new-password" className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      New Enterprise Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 select-none">
                        <Lock className="w-4 h-4 text-[#DFFF4F]" />
                      </div>
                      <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#111624]/80 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DFFF4F] focus:ring-1 focus:ring-[#DFFF4F] transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="confirm-new-password" className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 select-none">
                        <Lock className="w-4 h-4 text-[#DFFF4F]" />
                      </div>
                      <input
                        id="confirm-new-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#111624]/80 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DFFF4F] focus:ring-1 focus:ring-[#DFFF4F] transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-complete-reset"
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
                        <span>Applying Credentials Override...</span>
                      </>
                    ) : (
                      'Complete credentials update'
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
                  <h2 className="text-xl font-black font-display text-white">Credentials updated</h2>
                  <p className="text-[11.5px] text-slate-400 font-semibold leading-relaxed">
                    Your password override query is active. You may now return to the main entry door to authenticate.
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
        <div className="text-center mt-12 text-[9px] text-slate-655 text-slate-650 font-sans font-bold uppercase tracking-widest">
          <span>Sky Automation Tech © 2026</span>
        </div>
      </motion.div>
    </div>
  );
};
