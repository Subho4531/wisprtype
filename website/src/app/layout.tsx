import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google'
import LenisProvider from '../components/effects/LenisProvider'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })

export const metadata: Metadata = {
  metadataBase: new URL('https://wisprtype.com'),
  title: 'WisprType — Your Voice, Perfectly Typed',
  description: 'Free voice-to-text for Windows. On-device Whisper AI, 50+ languages, 100% offline. Download now.',
  openGraph: {
    title: 'WisprType — Your Voice, Perfectly Typed',
    description: 'Free voice-to-text for Windows powered by on-device Whisper AI. 50+ languages, 100% offline, privacy-first.',
    url: 'https://wisprtype.com',
    siteName: 'WisprType',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WisprType — Your Voice, Perfectly Typed',
    description: 'Free voice-to-text for Windows powered by on-device Whisper AI.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icons/wisperflow.png',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${spaceGrotesk.variable}`}>
      <body>

        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  )
}
