import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Radico Khaitan Dashboard',
  description: 'Advanced Sales Analytics Dashboard for Radico Khaitan - Real-time business insights and performance tracking',
  keywords: 'Radico Khaitan, Sales Dashboard, Analytics, 8PM, VERVE, Business Intelligence, Performance Tracking',
  authors: [{ name: 'Radico Analytics Team' }],
  openGraph: {
    title: 'Radico Khaitan Dashboard',
    description: 'Advanced sales analytics and business intelligence platform',
    type: 'website',
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1e40af" />
      </head>
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}
