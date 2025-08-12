import './globals.css';

export const metadata = {
  title: 'Travel Budget Simulator',
  description: 'Plan multi-country travel budgets with sharing and live multipliers'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
