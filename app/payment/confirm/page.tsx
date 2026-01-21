'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    fetch(`/api/checkout/session?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'complete' || data.payment_status === 'paid') {
          // Update tokens in localStorage
          const savedUser = localStorage.getItem('bento_user');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            // We'll estimate tokens based on the price or just use a default
            const tokensToAdd = data.tokens >= 20 ? 50 : (data.tokens >= 9 ? 15 : 5);
            user.tokens = (user.tokens || 0) + tokensToAdd;
            localStorage.setItem('bento_user', JSON.stringify(user));
          }
          setStatus('success');
          setTimeout(() => {
            router.push('/?view=profile&payment=success');
          }, 2000);
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [sessionId, router]);

  return (
    <div className="min-h-screen bg-bg-cool flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-4 border-navy/5 text-center max-w-md w-full">
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="w-16 h-16 border-4 border-navy/5 border-t-primary rounded-full animate-spin mx-auto"></div>
            <h2 className="text-2xl font-black text-navy">Verifying Payment...</h2>
          </div>
        )}
        {status === 'success' && (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-black text-navy">Payment Successful!</h2>
            <p className="text-navy/40 font-bold uppercase tracking-widest text-xs">Your credits have been added. Redirecting to your profile...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-6">
            <div className="text-6xl">❌</div>
            <h2 className="text-2xl font-black text-navy">Verification Failed</h2>
            <button onClick={() => router.push('/')} className="bg-navy text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Return Home</button>
          </div>
        )}
      </div>
    </div>
  );
}