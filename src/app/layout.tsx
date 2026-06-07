import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'Genius Grid',
  description: 'Agent Factory & AI-Native Development Practice Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Inline script prevents dark-mode flash before React hydrates */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(localStorage.getItem('gg-theme')==='dark'){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
