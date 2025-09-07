import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { ErrorBoundary } from './components/UI/ErrorBoundary'
import { NotificationProvider } from './components/UI/NotificationSystem'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Co-Creative Canvas',
  description: 'Real-time collaborative design studio with AI image generation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}