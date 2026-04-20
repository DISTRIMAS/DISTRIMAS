import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Distrimas SC',
  description: 'Sistema de Gestion',
  icons: {
    icon: 'https://zwilxcrbukksmwuqkfay.supabase.co/storage/v1/object/public/imagenes/logo.png',
    apple: 'https://zwilxcrbukksmwuqkfay.supabase.co/storage/v1/object/public/imagenes/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
