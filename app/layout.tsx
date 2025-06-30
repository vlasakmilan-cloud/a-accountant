import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'A!Accountant - AI Účetní Software',
  description: 'Kompletní účetní software ovládaný umělou inteligencí',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
