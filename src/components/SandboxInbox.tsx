import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Mail, Clock, ShieldCheck, Copy, Check, Info } from 'lucide-react';

interface SandboxInboxProps {
  email: string;
}

export const SandboxInbox: React.FC<SandboxInboxProps> = ({ email }) => {
  const [activeOtp, setActiveOtp] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!email) {
      setActiveOtp(null);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const unsub = onSnapshot(doc(db, 'otps', normalizedEmail), (docSnap) => {
      if (docSnap.exists()) {
        setActiveOtp(docSnap.data());
      } else {
        setActiveOtp(null);
      }
    }, (error) => {
      console.warn("Sandbox inbox doc subscription silent failed:", error);
    });

    return () => unsub();
  }, [email]);

  const handleCopy = () => {
    if (activeOtp?.otp) {
      navigator.clipboard.writeText(activeOtp.otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!email) return null;

  return (
    <div id="sandbox-mailbox-widget" className="mt-6 border border-white/5 bg-slate-950/40 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-[#111624]/60 hover:bg-[#151c2d] flex items-center justify-between text-left transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Mail className="w-4 h-4 text-[#DFFF4F]" />
            {activeOtp && (
              <span className="absolute -top-1.5 -right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-300 block">
              📬 Developer Mail Sandbox Gate
            </span>
            <span className="text-[9px] text-slate-500 block">
              {activeOtp ? `1 Active Authorization Code Pending` : `Listening on SMTP channels for ${email}...`}
            </span>
          </div>
        </div>
        <span className="text-[10px] text-[#DFFF4F] font-black uppercase tracking-wider">
          {isOpen ? 'Fold Portal' : 'Expand Terminal'}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-white/5 bg-black/40 space-y-3 font-sans">
          {activeOtp ? (
            <div className="space-y-3">
              {/* Fake Email Header */}
              <div className="pb-2.5 border-b border-white/5 text-[10px] font-mono text-slate-400 space-y-1">
                <div>
                  <span className="text-slate-600 font-bold">FROM:</span>{" "}
                  <span className="text-slate-300">Sky InfoSec Gate &lt;noreply@skyautomation.com&gt;</span>
                </div>
                <div>
                  <span className="text-slate-600 font-bold">TO:</span>{" "}
                  <span className="text-[#DFFF4F] font-bold">{email}</span>
                </div>
                <div>
                  <span className="text-slate-600 font-bold">SUBJECT:</span>{" "}
                  <span className="text-white font-extrabold">
                    {activeOtp.type === 'registration' 
                      ? '🔑 SKY Automation ERP - Complete Registration Credentials' 
                      : '🔄 SKY Automation ERP - Security Code Authorization Reset'}
                  </span>
                </div>
              </div>

              {/* Fake Email Content */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10/20 space-y-3 relative overflow-hidden">
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#DFFF4F]/10 border border-[#DFFF4F]/20 text-[#DFFF4F] px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase leading-none">
                  <Clock className="w-2.5 h-2.5" />
                  <span>5m Active</span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Greetings,
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  An authorization event occurred at <span className="font-mono text-white select-all">{new Date(activeOtp.createdAt).toLocaleTimeString()}</span>. Use the following dynamic secure 6-digit OTP passcode to authorize the action:
                </p>

                {/* Big OTP Display */}
                <div className="my-4 py-3.5 bg-black/60 rounded-xl border border-white/5 flex items-center justify-center gap-4 relative group">
                  <span className="text-2xl font-black font-mono tracking-widest text-[#DFFF4F] select-all">
                    {activeOtp.otp.slice(0,3)} {activeOtp.otp.slice(3,6)}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="absolute right-3 p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Copy OTP to Clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-2.5 bg-slate-900/30 rounded-lg text-[10px] text-slate-400 leading-relaxed font-semibold space-y-1">
                  <div className="flex gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#DFFF4F] shrink-0" />
                    <span>This code is strictly limited to 5 verification attempts for anti-brute defense. Attempts recorded: <span className="text-amber-400 font-bold">{activeOtp.attempts || 0}/5</span>.</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed">
                  If this was not initiated by you, ignore this. Standard InfoSec parameters apply.
                  <br />
                  <span className="font-mono text-slate-600 block mt-1">S.A.T Secure Gate Layer • node-prod-43</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-2 text-slate-500 select-none">
              <Mail className="w-8 h-8 mx-auto stroke-1" />
              <p className="text-xs font-semibold leading-relaxed">Inbox empty. Trigger the registration process or password reset first to dispatch the dynamic 6-digit verification code here.</p>
              <div className="flex items-center justify-center gap-1.5 p-2 bg-yellow-500/5 text-yellow-600 border border-yellow-550/10 text-[9px] rounded-lg tracking-wide uppercase font-mono max-w-xs mx-auto">
                <Info className="w-3 h-3 text-[#DFFF4F]" />
                <span>Simulated Mailbox Active</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
