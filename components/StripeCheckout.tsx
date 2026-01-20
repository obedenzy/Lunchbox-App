'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { createCheckoutSession } from '../services/stripeService';

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY || '');

interface StripeCheckoutProps {
  tokens: number;
  amount: string;
  label: string;
  onCancel: () => void;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({ tokens, amount, label, onCancel }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createCheckoutSession(tokens, amount, label)
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      })
      .catch((err) => {
        setError(err.message || 'Could not connect to payment server.');
      });
  }, [tokens, amount, label]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl space-y-8 overflow-hidden">
        <div className="flex justify-between items-center border-b-4 border-bg-cool pb-8">
          <div>
            <h2 className="text-2xl font-black text-navy">{label}</h2>
            <p className="text-navy/40 font-black uppercase tracking-widest text-[10px] mt-1">{tokens} Generation Credits</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-primary">{amount}</span>
          </div>
        </div>

        {error && (
          <div className="p-6 bg-primary/10 border border-primary/20 text-primary-dark rounded-2xl text-center text-sm font-black">
            {error}
          </div>
        )}

        {!clientSecret && !error && (
          <div className="py-20 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-navy/5 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-navy/40 font-black tracking-widest text-[10px] uppercase">Connecting to Stripe...</p>
          </div>
        )}

        {clientSecret && (
          <div className="min-h-[400px]">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}

        <button 
          onClick={onCancel}
          className="w-full py-4 text-[10px] font-black text-navy/20 uppercase tracking-widest hover:text-navy transition-all"
        >
          Cancel and Return
        </button>
      </div>
    </div>
  );
};