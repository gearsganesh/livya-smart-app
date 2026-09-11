import type { Metadata } from 'next';
import './globals.css';
import './desktop-responsive.css';
import './empty.css';

export const metadata: Metadata = {
  title: 'LIVYA',
  description: 'Your health, understood.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
