import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LIVYA Admin',
  description: 'LIVYA clinical and operations administration'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
