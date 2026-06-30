'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const pathname = usePathname()

  return (
    <header
      className="h-14 flex items-center justify-between px-4 sm:px-8"
      style={{ background: 'linear-gradient(135deg, #E91E8C 0%, #7B1FA2 100%)' }}
    >
      <Link href="/" className="text-white font-heading font-bold text-base hover:text-white/90 transition-colors">Grupo Mulheres do Brasil</Link>
      <nav aria-label="Navegação principal" className="flex items-center gap-6">
        <Link
          href="/mapa"
          aria-current={pathname === '/mapa' ? 'page' : undefined}
          className="hidden sm:inline text-white/80 text-sm hover:text-white transition-colors"
        >
          Mapa Público
        </Link>
        <Link
          href="/entrar"
          aria-current={pathname === '/entrar' ? 'page' : undefined}
          className="bg-white text-primary font-semibold text-sm px-5 py-2 rounded-full hover:bg-white/90 transition-colors"
        >
          Entrar
        </Link>
      </nav>
    </header>
  )
}
