"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Vietnam phone number regex (simplified)
const VN_PHONE_REGEX = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const verifierInstanceRef = useRef<RecaptchaVerifier | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Avoid double initialization or running on server
    if (typeof window === 'undefined' || !recaptchaRef.current || recaptchaVerifier) return;

    const initRecaptcha = async () => {
      try {
        const firebaseAuth = auth;
        if (!firebaseAuth || !recaptchaRef.current) return;

        // Clear existing content to prevent 'already rendered' errors
        recaptchaRef.current.innerHTML = '';

        // Use 'normal' size (checkbox) as it's often more reliable in iframes
        const verifier = new RecaptchaVerifier(firebaseAuth, recaptchaRef.current, {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
          }
        });
        
        await verifier.render();
        
        // Some internal Firebase logic relies on this
        (window as any).recaptchaVerifier = verifier;
        
        verifierInstanceRef.current = verifier;
        setRecaptchaVerifier(verifier);
        console.log('reCAPTCHA initialized');
      } catch (err) {
        console.error('reCAPTCHA init error:', err);
        setError('Lỗi khởi tạo bảo mật. Hãy đảm bảo Domain này đã được thêm vào "Authorized Domains" trong Firebase Console.');
      }
    };

    initRecaptcha();

    return () => {
      if (verifierInstanceRef.current) {
        try {
          verifierInstanceRef.current.clear();
          delete (window as any).recaptchaVerifier;
        } catch (e) {
          // Ignore
        }
        verifierInstanceRef.current = null;
        setRecaptchaVerifier(null);
      }
    };
  }, []); // Remove dependencies to run only on mount/unmount

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Clean phone number
    let cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    
    // Basic length validation
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      setError('Số điện thoại không hợp lệ (9-11 số).');
      return;
    }

    if (cleanPhone.startsWith('0')) {
        cleanPhone = '+84' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('84') && !cleanPhone.startsWith('+')) {
        cleanPhone = '+84' + cleanPhone;
    } else if (cleanPhone.startsWith('84')) {
        cleanPhone = '+' + cleanPhone;
    }

    if (!recaptchaVerifier) {
        setError('Lỗi bảo mật: reCAPTCHA chưa sẵn sàng. Vui lòng tải lại trang.');
        return;
    }

    setLoading(true);
    try {
        console.log("Attempting sign in with:", cleanPhone);
        const result = await signInWithPhoneNumber(auth, cleanPhone, recaptchaVerifier);
        setConfirmationResult(result);
        setStep('otp');
    } catch (err: any) {
        console.error("Firebase Auth Error Detail:", {
          code: err.code,
          message: err.message,
          customData: err.customData,
          full: err
        });
        
        // Display more specific advice for internal-error
        if (err.code === 'auth/internal-error') {
            setError('Lỗi hệ thống Firebase. Hãy kiểm tra: 1. Đã thêm domain AI Studio (ais-dev-... & ais-pre-...) vào Authorized Domains chưa? 2. Đã bật Identity Toolkit API chưa? 3. Firebase Config có đúng projectId và authDomain không?');
        } else if (err.code === 'auth/invalid-phone-number') {
            setError('Số điện thoại không hợp lệ hoặc bị Firebase từ chối.');
        } else if (err.code === 'auth/too-many-requests') {
            setError('Quá nhiều yêu cầu. Hãy thử lại bằng số điện thoại khác hoặc đợi vài phút.');
        } else if (err.code === 'auth/billing-not-enabled') {
            setError('Cần nâng cấp gói Blaze để gửi SMS tới số điện thoại thật.');
        } else {
            setError(`Lỗi: ${err.message || 'Không thể gửi mã xác thực.'}`);
        }
        
        // Help with re-init
        try {
          await recaptchaVerifier.render();
        } catch (reErr) {
          setRecaptchaVerifier(null);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    
    setError(null);
    setLoading(true);
    try {
        await confirmationResult.confirm(otp);
        // Auth state will change automatically
    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/invalid-verification-code') {
            setError('Mã xác thực không chính xác.');
        } else {
            setError('Xác thực thất bại. Vui lòng thử lại.');
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-md mx-auto p-6">
      <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-4">
                <Phone className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
                {step === 'phone' ? 'Đăng nhập' : 'Xác thực OTP'}
            </h2>
            <p className="text-gray-500 mt-2">
                {step === 'phone' 
                    ? 'Nhập số điện thoại để tiếp tục' 
                    : `Mã OTP đã được gửi đến ${phoneNumber}`}
            </p>
        </div>

        {error && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm"
            >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
            </motion.div>
        )}

        <form onSubmit={step === 'phone' ? handleSendOtp : handleVerifyOtp} className="space-y-6">
            <AnimatePresence mode="wait">
                {step === 'phone' ? (
                    <motion.div
                        key="phone-input"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                    >
                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                                <span className="font-medium">+84</span>
                            </div>
                            <input
                                type="tel"
                                placeholder="Nhập số điện thoại (VD: 0912...)"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                                required
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="otp-input"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <input
                            type="text"
                            placeholder="Nhập 6 số OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            className="w-full px-4 py-4 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-2xl font-bold tracking-[0.5em]"
                            required
                        />
                        <button 
                            type="button"
                            onClick={() => setStep('phone')}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Thay đổi số điện thoại
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        {step === 'phone' ? 'Tiếp tục' : 'Xác nhận'}
                        <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </button>
        </form>

        <div id="recaptcha-container" ref={recaptchaRef}></div>
      </div>
    </div>
  );
}
