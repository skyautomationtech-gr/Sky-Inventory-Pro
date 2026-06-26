import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Lock, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  UploadCloud, 
  Eye, 
  EyeOff, 
  FileText, 
  ChevronDown, 
  Phone, 
  Calendar,
  X,
  FileCheck
} from 'lucide-react';
import skyLogo from '../components/Sky.jpeg';

export const Register: React.FC = () => {
  const { registerUser, sendRegisterOTP, verifyOTP } = useApp();
  const navigate = useNavigate();

  // Step state: 1 | 2 | 3 | 'pending_screen'
  const [step, setStep] = useState<1 | 2 | 3 | 'pending_screen'>(1);

  // Error & loading states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STEP 1 FORM STATE ---
  const [fullName, setFullName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // --- STEP 2 FORM STATE ---
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);
  const [otpArray, setOtpArray] = useState<string[]>(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // --- STEP 3 FORM STATE ---
  const [joinRole, setJoinRole] = useState<'staff' | 'warehouseStaff'>('staff');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // CV Upload State
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUploadProgress, setCvUploadProgress] = useState(0);
  const [cvUrl, setCvUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Month mapping
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Generate days 1-31
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  
  // Generate years (1940 to 2016)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1940 - 9 }, (_, i) => String(currentYear - 10 - i));

  // Step countdown timer
  useEffect(() => {
    let timer: any;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  // Handle OTP inputs autofocus advancement
  const handleOtpInput = (index: number, val: string) => {
    const char = val.slice(-1);
    if (/[^0-9]/.test(char) && char !== '') return;

    const updated = [...otpArray];
    updated[index] = char;
    setOtpArray(updated);

    if (char !== '' && index < 5) {
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

    const targetIdx = Math.min(pasted.length, 5);
    otpRefs[targetIdx].current?.focus();
  };

  // Bangladesh Phone Number regex validator
  const validateBangladeshPhone = (phone: string) => {
    const normalized = phone.trim();
    const bdRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
    return bdRegex.test(normalized);
  };

  // Email format validator with disposable blocklist
  const validateEmailFormat = (val: string) => {
    const emailStr = val.trim().toLowerCase();
    const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!basicRegex.test(emailStr)) {
      return { valid: false, message: 'Please specify a valid email address format.' };
    }

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
      return { valid: false, message: 'Disposable or temporary emails are not allowed for corporate profiles.' };
    }

    return { valid: true, message: '' };
  };

  // Password password strength analyzer
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-slate-200', textStyle: 'text-slate-400' };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) {
      return { score, label: 'Weak', color: 'bg-rose-500', textStyle: 'text-rose-500' };
    } else if (score <= 4) {
      return { score, label: 'Medium', color: 'bg-amber-500', textStyle: 'text-amber-500' };
    } else {
      return { score, label: 'Strong', color: 'bg-emerald-500', textStyle: 'text-emerald-500' };
    }
  };

  const pwdStrength = getPasswordStrength(password);

  // Drag & Drop handlers for CV file upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setErrorMsg(null);
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx'];

    if (!extension || !allowedExtensions.includes(extension)) {
      setErrorMsg('Invalid file format. Allowed formats: PDF, DOC, DOCX only.');
      return;
    }

    const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeInBytes) {
      setErrorMsg('File size exceeds the 10 MB storage limit.');
      return;
    }

    setCvFile(file);
    simulateCvUpload(file);
  };

  const simulateCvUpload = (file: File) => {
    setCvUploading(true);
    setCvUploadProgress(0);

    const interval = setInterval(() => {
      setCvUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setCvUploading(false);
          setCvUrl(`https://firebasestorage.googleapis.com/v0/b/sky-automation/o/cvs%2F${Date.now()}_${encodeURIComponent(file.name)}?alt=media`);
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  // Navigating Steps
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }

    if (!birthDay || !birthMonth || !birthYear) {
      setErrorMsg('Complete Date of Birth is required.');
      return;
    }

    if (!phoneNumber.trim()) {
      setErrorMsg('Phone Number is required.');
      return;
    }

    if (!validateBangladeshPhone(phoneNumber)) {
      setErrorMsg('Please specify a valid Bangladesh phone format (+8801XXXXXXXXX or 01XXXXXXXXX).');
      return;
    }

    setStep(2);
  };

  const handleSendOtp = async () => {
    setErrorMsg(null);
    const emailCheck = validateEmailFormat(email);
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.message);
      return;
    }

    setSendingOtp(true);
    try {
      const generatedOtp = await sendRegisterOTP(email);
      setSandboxOtp(generatedOtp);
      setOtpSent(true);
      setCountdown(60);
      setCanResend(false);
      setOtpArray(['', '', '', '', '', '']);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification delivery pipeline issue. Please check email details.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg(null);
    const code = otpArray.join('');
    if (code.length < 6) {
      setErrorMsg('Please type the complete 6-digit verification code.');
      return;
    }

    setVerifyingOtp(true);
    try {
      await verifyOTP(email, code, 'registration');
      setOtpVerified(true);
      setOtpSuccessMessage('Email verified successfully.');
      setTimeout(() => {
        setStep(3);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed. Check the code and try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!otpVerified) {
      setErrorMsg('Your email must be verified prior to creating an account.');
      return;
    }

    // Password Checks
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setErrorMsg('Password must include uppercase, lowercase, numbers, and special characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Document CV Check
    if (!cvUrl) {
      setErrorMsg('Your CV document is required to complete registration.');
      return;
    }

    // Terms
    if (!agreeTerms) {
      setErrorMsg('You must agree to the terms & conditions.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dobString = `${birthYear}-${birthMonth}-${birthDay}`;
      await registerUser(fullName, email, password, dobString, phoneNumber, joinRole, cvUrl);
      setStep('pending_screen');
    } catch (err: any) {
      setErrorMsg(err.message || 'Account registration failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background radial soft shapes */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl z-10 my-4 sm:my-8"
      >
        {/* Branding header in Slate/Emerald style */}
        <div className="flex flex-col items-center mb-6 text-center select-none">
          <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md border border-slate-100 overflow-hidden mb-3 flex items-center justify-center">
            <img 
              src={skyLogo} 
              alt="SKY AUTOMATION TECH" 
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
            SKY AUTOMATION TECH
          </h1>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
            Play Store Registrations System
          </p>
        </div>

        {/* Dynamic Stepper Progress Indicator */}
        {step !== 'pending_screen' && (
          <div className="mb-6 px-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2.5">
              <span className={step === 1 ? 'text-emerald-600 font-bold' : ''}>1. Profile</span>
              <span className={step === 2 ? 'text-emerald-600 font-bold' : ''}>2. Verification</span>
              <span className={step === 3 ? 'text-emerald-600 font-bold' : ''}>3. Account &amp; Files</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Central Card with Play Store aesthetics */}
        <div className="bg-white border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.04)] rounded-[28px] p-6 sm:p-8 relative">
          
          {/* Universal Error Message */}
          {errorMsg && step !== 'pending_screen' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold leading-relaxed flex items-start gap-2.5"
            >
              <ShieldAlert className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: PERSONAL INFORMATION */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-800">Personal Information</h2>
                  <p className="text-xs text-slate-400 mt-1">Please specify your real profile information for approval verification.</p>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="reg-fullname" className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <input
                        id="reg-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Abdullah Al Mamun"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Date of Birth Dropdowns */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                      Date of Birth
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Day */}
                      <div className="relative">
                        <select
                          id="select-dob-day"
                          value={birthDay}
                          onChange={(e) => setBirthDay(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-3.5 py-3 text-xs text-slate-800 font-semibold focus:outline-none appearance-none cursor-pointer"
                          required
                        >
                          <option value="">Day</option>
                          {days.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Month */}
                      <div className="relative">
                        <select
                          id="select-dob-month"
                          value={birthMonth}
                          onChange={(e) => setBirthMonth(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-3.5 py-3 text-xs text-slate-800 font-semibold focus:outline-none appearance-none cursor-pointer"
                          required
                        >
                          <option value="">Month</option>
                          {months.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Year */}
                      <div className="relative">
                        <select
                          id="select-dob-year"
                          value={birthYear}
                          onChange={(e) => setBirthYear(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-3.5 py-3 text-xs text-slate-800 font-semibold focus:outline-none appearance-none cursor-pointer"
                          required
                        >
                          <option value="">Year</option>
                          {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label htmlFor="reg-phone" className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Phone className="w-4.5 h-4.5" />
                      </div>
                      <input
                        id="reg-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Bangladesh (+8801XXXXXXXXX or 01XXXXXXXXX)"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3">
                    <button
                      id="btn-step1-next"
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl py-3 text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2: EMAIL VERIFICATION */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Email Verification</h2>
                    <p className="text-xs text-slate-400 mt-1">We need to verify your secure registration email.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Email input line */}
                <div className="space-y-1.5">
                  <label htmlFor="reg-email" className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail className="w-4.5 h-4.5" />
                      </div>
                      <input
                        id="reg-email"
                        type="email"
                        value={email}
                        disabled={otpVerified || otpSent}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. employee@skyautomation.com"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 disabled:bg-slate-100 disabled:text-slate-500 transition-all font-semibold"
                        required
                      />
                    </div>
                    {!otpVerified && !otpSent && (
                      <button
                        id="btn-send-otp"
                        type="button"
                        disabled={sendingOtp || !email}
                        onClick={handleSendOtp}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs rounded-2xl px-5 transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                      >
                        {sendingOtp ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send OTP</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sandbox OTP Notification Box */}
                {otpSent && !otpVerified && sandboxOtp && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800"
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <span className="text-sm">🔑</span>
                      <span>[SANDBOX ENVIRONMENT] Secure OTP Delivered:</span>
                    </p>
                    <p className="text-lg font-mono font-black tracking-widest text-emerald-700 mt-1.5 select-all text-center bg-white border border-amber-100 rounded-xl py-1.5">
                      {sandboxOtp}
                    </p>
                    <p className="text-[10px] text-amber-600 font-medium mt-1 text-center">
                      Copy and paste this code to proceed. In production, this goes to the email client.
                    </p>
                  </motion.div>
                )}

                {/* OTP Input Fields */}
                {otpSent && !otpVerified && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2"
                  >
                    <div className="space-y-1.5 text-center">
                      <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block text-left">
                        Enter 6-Digit OTP
                      </label>
                      <div className="flex justify-between gap-2 max-w-sm mx-auto">
                        {otpArray.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-input-${idx}`}
                            ref={otpRefs[idx]}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpInput(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            onPaste={handleOtpPaste}
                            className="w-11 h-12 text-center text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 rounded-xl focus:outline-none transition-all"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold">
                      <button
                        id="btn-resend-otp"
                        type="button"
                        disabled={!canResend}
                        onClick={handleSendOtp}
                        className="text-emerald-600 hover:text-emerald-500 disabled:text-slate-400 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{canResend ? 'Resend OTP' : `Resend in (${countdown}s)`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setSandboxOtp(null);
                        }}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Change Email Address
                      </button>
                    </div>

                    <button
                      id="btn-verify-otp"
                      type="button"
                      disabled={verifyingOtp || otpArray.some(d => d === '')}
                      onClick={handleVerifyOtp}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {verifyingOtp ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Verify OTP</span>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Verification success state */}
                {otpVerified && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-2"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    <h3 className="text-sm font-bold text-emerald-900">{otpSuccessMessage}</h3>
                    <p className="text-[11px] text-emerald-600 font-semibold">Proceeding to complete account setup...</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 3: ACCOUNT INFORMATION & CV UPLOAD */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Account Credentials</h2>
                    <p className="text-xs text-slate-400 mt-1">Specify role details, secure passwords and submit your CV.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </button>
                </div>

                <form onSubmit={handleStep3Submit} className="space-y-4">
                  {/* Join As */}
                  <div className="space-y-1.5">
                    <label htmlFor="reg-role" className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                      Join As Role
                    </label>
                    <div className="relative">
                      <select
                        id="reg-role"
                        value={joinRole}
                        onChange={(e) => setJoinRole(e.target.value as 'staff' | 'warehouseStaff')}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none appearance-none cursor-pointer"
                        required
                      >
                        <option value="staff">Staff</option>
                        <option value="warehouseStaff">Warehouse Staff</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[9.5px] text-slate-400 font-medium">Note: Only Super Admins can assign the Admin role.</p>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Password */}
                    <div className="space-y-1.5">
                      <label htmlFor="reg-pwd" className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                        Create Password
                      </label>
                      <div className="relative">
                        <input
                          id="reg-pwd"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl pl-4 pr-10 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all font-semibold"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm */}
                    <div className="space-y-1.5">
                      <label htmlFor="reg-confirmpwd" className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="reg-confirmpwd"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl pl-4 pr-10 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all font-semibold"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Meter */}
                  {password && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400 uppercase tracking-wider">Strength Indicator:</span>
                        <span className={`${pwdStrength.textStyle} uppercase tracking-wider`}>{pwdStrength.label}</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((index) => (
                          <div 
                            key={index} 
                            className={`h-full flex-1 transition-all duration-300 ${index <= pwdStrength.score ? pwdStrength.color : 'bg-slate-200'}`}
                          ></div>
                        ))}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium leading-relaxed mt-1">
                        Must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.
                      </div>
                    </motion.div>
                  )}

                  {/* Upload CV Dropzone */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                      Upload Your CV (Required)
                    </label>
                    
                    {!cvFile ? (
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-3xl p-5 text-center transition-all ${
                          dragActive 
                            ? 'border-emerald-500 bg-emerald-50/20' 
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                        }`}
                      >
                        <input
                          id="file-cv-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label 
                          htmlFor="file-cv-upload"
                          className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                        >
                          <UploadCloud className="w-8 h-8 text-slate-400 animate-pulse" />
                          <p className="text-xs font-bold text-slate-700">Drag &amp; drop your CV here, or browse</p>
                          <p className="text-[10px] text-slate-400 font-medium">Supported files: PDF, DOC, DOCX up to 10 MB</p>
                        </label>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
                            {cvUploading ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <FileCheck className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate" title={cvFile.name}>
                              {cvFile.name}
                            </p>
                            <p className="text-[9.5px] text-slate-400 font-medium font-mono mt-0.5">
                              {(cvFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        {!cvUploading ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCvFile(null);
                              setCvUrl('');
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="text-xs font-bold text-emerald-600 font-mono">
                            {cvUploadProgress}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      id="checkbox-terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      required
                    />
                    <label htmlFor="checkbox-terms" className="text-[10.5px] text-slate-500 font-semibold leading-normal select-none cursor-pointer">
                      I agree to the <span className="text-emerald-600 hover:underline font-bold">Terms &amp; Conditions</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="pt-3">
                    <button
                      id="btn-create-account"
                      type="submit"
                      disabled={isSubmitting || cvUploading || !cvUrl || !agreeTerms}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Creating Enterprise Account...</span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          Create Account <Check className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* PENDING APPROVAL SCREEN */}
            {step === 'pending_screen' && (
              <motion.div
                key="pending-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-6"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center text-amber-600 mb-4 animate-bounce">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-800">Your registration has been submitted successfully.</h2>
                </div>

                <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-3xl text-xs text-slate-600 leading-relaxed text-left space-y-3.5 font-medium">
                  <p className="font-extrabold text-amber-800 text-sm flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span>Your account is currently Pending Approval.</span>
                  </p>
                  <p>A Super Admin will review your information.</p>
                  <p>Once your account has been approved, you will receive a confirmation email.</p>
                  <p>After approval, you will be able to sign in and access all features allowed by your assigned role.</p>
                  <p className="font-bold text-slate-700">Thank you for joining Sky Automation Tech.</p>
                </div>

                <div className="pt-3">
                  <button
                    id="btn-back-to-login"
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full bg-slate-800 hover:bg-slate-750 text-white rounded-2xl py-3 text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Sign In</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Links & footers */}
        {step !== 'pending_screen' && (
          <div className="text-center mt-5">
            <p className="text-xs text-slate-500 font-semibold">
              Already possess credentials?{' '}
              <Link to="/login" className="text-emerald-600 hover:underline font-extrabold">
                Sign In to Node
              </Link>
            </p>
          </div>
        )}

        <div className="text-center mt-8 text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
          <span>Sky Automation Tech &copy; 2026</span>
        </div>
      </motion.div>
    </div>
  );
};
