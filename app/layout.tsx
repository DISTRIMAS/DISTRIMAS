import type { Metadata } from 'next'
import './globals.css'

const LOGO = 'https://zwilxcrbukksmwuqkfay.supabase.co/storage/v1/object/public/imagenes/logo.png'

export const metadata: Metadata = {
  title: 'Distrimas SC',
  description: 'Sistema de Gestión',
  icons: {
    icon: LOGO,
    shortcut: LOGO,
    apple: LOGO,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
