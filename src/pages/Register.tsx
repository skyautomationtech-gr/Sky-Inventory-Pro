import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, ShieldAlert, ArrowRight, Server, Building, KeyRound, Check, RefreshCw, Send } from 'lucide-react';
import skyLogo from '../components/Sky.jpeg';

export const Register: React.FC = () => {
  const { registerUser, resendVerification } = useApp();
  const navigate = useNavigate();

  // Step state: 'form' or 'otp'
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form states
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password password strength
  const [strengthScore, setStrengthScore] = useState(0); // 0 to 4
  const [strengthLabel, setStrengthLabel] = useState('Empty');
  const [strengthColor, setStrengthColor] = useState('bg-slate-800');

  // Status indicators
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // OTP inputs
  const [otpArray, setOtpArray] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);

  // Resend Countdown
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer loop
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

  // Analyze password strength when password changes
  useEffect(() => {
    if (!password) {
      setStrengthScore(0);
      setStrengthLabel('None');
      setStrengthColor('bg-slate-800');
      return;
    }

    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    setStrengthScore(score);

    switch (score) {
      case 1:
        setStrengthLabel('Weak');
        setStrengthColor('bg-rose-500');
        break;
      case 2:
        setStrengthLabel('Fair');
        setStrengthColor('bg-amber-500');
        break;
      case 3:
        setStrengthLabel('Medium');
        setStrengthColor('bg-cyan-400');
        break;
      case 4:
        setStrengthLabel('Strong (Secure)');
        setStrengthColor('bg-[#DFFF4F]');
        break;
      default:
        setStrengthLabel('Weak');
        setStrengthColor('bg-rose-500');
    }
  }, [password]);

  const validateEmail = (val: string) => {
    const emailStr = val.trim().toLowerCase();
    // 1. Basic format regex check (at least 2 character TLD)
    const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!basicRegex.test(emailStr)) {
      return { valid: false, message: 'Please enter a valid email format (e.g., name@domain.com).' };
    }

    // 2. Block typical disposable/fake/temporary email domains
    const disposableDomains = [
      'mailinator.com', '10minutemail.com', 'tempmail.com', 'dispostable.com', 
      'yopmail.com', 'trashmail.com', 'guerrillamail.com', 'getairmail.com', 
      'sharklasers.com', 'guerrillamailblock.com', 'guerrillamail.net', 
      'guerrillamail.org', 'guerrillamail.biz', 'fakeinbox.com', 'mintemail.com', 
      'mailnesia.com', 'maildrop.cc', 'disposable.com', 'temp-mail.org',
      'yopmail.fr', 'yopmail.net', 'cool.fr.nf', 'jetable.org', 'dispostable.com',
      'tempmailaddress.com', 'disposablemail.com', 'fakeemail.com'
    ];

    const domain = emailStr.split('@')[1];
    if (disposableDomains.includes(domain)) {
      return { valid: false, message: 'Disposable or temporary email domains are not allowed. Please use a real email.' };
    }

    return { valid: true, message: '' };
  };

  // Step 1: Submit Form & Trigger Firebase Registration
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!businessName.trim()) {
      setErrorMsg('Business Name / Storefront Entity is required.');
      return;
    }
    
    const emailCheck = validateEmail(email);
    if (!email.trim() || !emailCheck.valid) {
      setErrorMsg(emailCheck.message || 'A valid email address is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser(fullName, email, password, businessName);
      setStep('otp'); // Move to the verification status screen
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration request pipeline failed. Email is likely already occupied.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Resend Verification Email
  const handleResendOtp = async () => {
    if (!canResend) return;
    setOtpError(null);
    setCountdown(60);
    setCanResend(false);
    
    try {
      await resendVerification(email, password);
      setOtpSuccess(true);
      setTimeout(() => setOtpSuccess(false), 5000);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to dispatch new verification email.');
    }
  };

  // Step 3: Handle single OTP digit entry with refocus logic
  const handleOtpInput = (index: number, val: string) => {
    const freshVal = val.slice(-1); // Only allow 1 char
    if (/[^0-9]/.test(freshVal) && freshVal !== '') return; // numeric check

    const updated = [...otpArray];
    updated[index] = freshVal;
    setOtpArray(updated);

    // Dynamic autofocus jump
    if (freshVal !== '' && index < 5) {
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
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = [...otpArray];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setOtpArray(updated);
    
    // Focus last parsed character
    const targetIdx = Math.min(pasted.length, 5);
    otpRefs[targetIdx].current?.focus();
  };

  // Step 4: Verify Entry & Complete Registry


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
        className="w-full max-w-md z-10 my-4"
      >
        {/* Branding Title */}
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

        {/* Central Glassmorphic Card */}
        <div className="bg-[#0c0f17]/60 border border-white/10 rounded-[24px] p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">
          <div className="absolute -top-px left-12 w-16 h-0.5 bg-[#DFFF4F] shadow-[0_0_10px_#DFFF4F]"></div>

          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="register-form-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold font-display tracking-tight text-white">Create Enterprise Account</h2>
                  <p className="text-[11px] text-slate-505 mt-0.5 font-semibold text-slate-400">Join today and build your business ledger ecosystem instantly.</p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
                  
                  {/* Error Indicator */}
                  {errorMsg && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 mt-0.5 text-rose-400 shrink-0" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="name-input" className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      Representative Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="name-input"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Shakil Ahmed"
                        className="w-full bg-[#111624]/80 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DFFF4F] focus:ring-1 focus:ring-[#DFFF4F] transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* Business Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="business-input" className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      Business / Outlet name
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Building className="w-4 h-4" />
                      </div>
                      <input
                        id="business-input"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Sky Automation Ltd"
                        className="w-full bg-[#111624]/80 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DFFF4F] focus:ring-1 focus:ring-[#DFFF4F] transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="email-input-reg" className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      Business Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="email-input-reg"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ceo@skyautomation.com"
                        className="w-full bg-[#111624]/80 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DFFF4F] focus:ring-1 focus:ring-[#DFFF4F] transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="password-input-reg" className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      Enterprise Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="password-input-reg"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#111624]/80 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DFFF4F] focus:ring-1 focus:ring-[#DFFF4F] transition-all font-semibold"
                      />
                    </div>
                    
                    {/* Animated Password Strength Gauge */}
                    {password && (
                      <div className="space-y-1 pt-1 animate-in fade-in duration-300">
                        <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest font-semibold text-slate-400">
                          <span>Password Security</span>
                          <span className="text-[#DFFF4F] font-bold">{strengthLabel}</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                          {[1, 2, 3, 4].map((barIndex) => (
                            <div 
                              key={barIndex} 
                              className={`h-full flex-1 transition-all duration-300 ${barIndex <= strengthScore ? strengthColor : 'bg-slate-800'}`}
                            ></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="confirm-password" className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      Confirm Enterprise Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#111624]/80 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DFFF4F] focus:ring-1 focus:ring-[#DFFF4F] transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="btn-submit-signup"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 bg-[#DFFF4F] hover:bg-[#ebff85] disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none font-black text-black rounded-xl py-3 text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(223,255,79,0.25)] hover:shadow-[0_4px_25px_rgba(223,255,79,0.45)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-black shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Requesting Authorization...</span>
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Register Enterprise Account <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>

                </form>
              </motion.div>
            ) : (
              <motion.div
                key="verification-sent-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 text-[#DFFF4F] mb-1 font-mono uppercase tracking-widest text-[9px] font-black border border-[#DFFF4F]/10 bg-[#DFFF4F]/5 px-2.5 py-1 rounded-full w-fit">
                    <Mail className="w-3 h-3" />
                    <span>Email Verification Sent</span>
                  </div>
                  <h2 className="text-xl font-black font-display tracking-tight text-white mt-2">Verify Your Account</h2>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-semibold">
                    We have dispatched a unique secure confirmation link to:
                    <span className="block text-[#DFFF4F] font-bold mt-0.5 select-all">{email}</span>
                  </p>
                </div>

                <div className="space-y-5">
                  {otpError && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1 }}
                      className="p-3 bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 mt-0.5 text-rose-450 shrink-0" />
                      <span>{otpError}</span>
                    </motion.div>
                  )}

                  {otpSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1 }}
                      className="p-3 bg-teal-950/40 border border-teal-500/20 text-teal-300 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2"
                    >
                      <Check className="w-3.5 h-3.5 mt-0.5 text-teal-455 shrink-0" />
                      <span>✓ Fresh email verification link dispatched successfully. Check your spam if not found.</span>
                    </motion.div>
                  )}

                  <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-slate-400 leading-relaxed font-medium space-y-1.5">
                    <p className="text-slate-300 font-extrabold flex items-center gap-1.5 text-[10.5px]">
                      Instructions:
                    </p>
                    <p>1. Open your inbox and click the verification link in the email.</p>
                    <p>2. Once verified, click the button below to log in securely.</p>
                    <p className="text-slate-500 text-[9px] mt-2">Note: Access to the ERP is granted after your email is verified and approved by a Super Admin.</p>
                  </div>

                  <button
                    id="btn-goto-login"
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full bg-[#DFFF4F] hover:bg-[#ebff85] font-black text-black rounded-xl py-3 text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(223,255,79,0.25)] hover:shadow-[0_4px_25px_rgba(223,255,79,0.45)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      id="btn-trigger-resend"
                      type="button"
                      disabled={!canResend}
                      onClick={handleResendOtp}
                      className="text-[11px] font-bold text-slate-400 hover:text-[#DFFF4F] disabled:text-slate-600 disabled:hover:text-slate-600 font-mono tracking-wide transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${!canResend ? '' : 'animate-spin'}`} />
                      {canResend ? 'Resend verification email' : `Resend in (${countdown}s)`}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      className="text-[11px] font-bold text-slate-500 hover:text-white transition-all cursor-pointer"
                    >
                      Change registration email
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Link back to login */}
        {step === 'form' && (
          <div className="text-center mt-5">
            <p className="text-xs text-slate-400 font-semibold">
              Already possess credentials?{' '}
              <Link to="/login" className="text-[#DFFF4F] hover:underline font-extrabold">
                Sign In to Node
              </Link>
            </p>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center mt-10 text-[9px] text-slate-650 font-sans font-bold uppercase tracking-widest">
          <span>Sky Automation Tech © 2026</span>
        </div>
      </motion.div>
    </div>
  );
};
