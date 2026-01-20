
// Import React to resolve 'Cannot find namespace React' error when using React.ReactNode on line 15
import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800', '900'] });

export const metadata = {
  title: 'BentoMagic - Modern Lunchbox Planning',
  description: 'Wholesome, delicious, and easy-to-prep lunch box ideas tailored for growing kids.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bg-cool text-navy antialiased`}>
        {children}
      </body>
    </html>
  );
}
