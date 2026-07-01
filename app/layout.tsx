import type { Metadata } from 'next'
import { DM_Sans, Plus_Jakarta_Sans } from 'next/font/google'
import { PerfilProvider } from '@/lib/context/perfil-context'
import { MultiplicadoresProvider } from '@/lib/context/multiplicadoras-context'
import { Providers } from './providers'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
})

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Painel Multiplicadores — Grupo Mulheres do Brasil',
  description: 'Painel de gestão de multiplicadores e rodas do Grupo Mulheres do Brasil',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${plusJakarta.variable} h-full`}>
      <body className="min-h-full bg-background antialiased">
        <Providers>
          <PerfilProvider>
            <MultiplicadoresProvider>
              <main>
                {children}
              </main>
            </MultiplicadoresProvider>
          </PerfilProvider>
        </Providers>
      </body>
    </html>
  )
}
