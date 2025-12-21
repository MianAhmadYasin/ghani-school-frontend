import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import AuthGate from '@/components/AuthGate'
import SessionManager from '@/components/SessionManager'
import { Toaster } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'School Management CRM',
  description: 'Professional school management system with advanced session handling',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthGate>
            <SessionManager />
            {children}
          </AuthGate>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}







