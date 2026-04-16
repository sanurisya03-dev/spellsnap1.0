import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SpellSnap! | Fun Spelling for ESL Learners',
  description: 'A digital spelling classroom innovation for young learners using gamified recall and visual aids.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/30 selection:text-foreground">
        {children}
      </body>
    </html>
  );
}