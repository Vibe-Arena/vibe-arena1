import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import MobileBlock from '@/components/MobileBlock'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vibe Arena',
  description: '1v1 AI battles. Real money. Best build wins.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#0a0a0a', margin: 0 }}>
        <MobileBlock>
          {children}
        </MobileBlock>
      </body>
    </html>
  )
}