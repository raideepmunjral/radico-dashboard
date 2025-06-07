import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Radico Field Collection - PWA',
  description: 'Progressive Web App for field sales data collection',
};

export default function PWALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="manifest" href="/radico-dashboard/pwa/manifest.json" />
      </head>
      <body>{children}</body>
    </html>
  );
}
