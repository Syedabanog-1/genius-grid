import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Genius Grid',
  description: 'Learn, compete, and win rewards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
