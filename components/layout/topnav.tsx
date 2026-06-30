'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Menu, X } from 'lucide-react'
import { usePerfil } from '@/lib/context/perfil-context'
import { cn } from '@/lib/utils'

const navPorPerfil = {
  administrador: [
    { href: '/dashboard',             label: 'Dashboard'          },
    { href: '/admin/multiplicadoras',   label: 'Multiplicadores'      },
    { href: '/relatorios',              label: 'Relatórios'           },
    { href: '/admin/configuracoes',     label: 'Configurações'        },
    { href: '/admin/regras-formacao',   label: 'Regras de Formação'   },
  ],
  coordenador: [
    { href: '/dashboard',       label: 'Dashboard Regional'  },
    { href: '/municipios',      label: 'Estados e Municípios' },
    { href: '/validacao',       label: 'Validação'            },
    { href: '/importar-rodas',  label: 'Importar Rodas'       },
    { href: '/relatorios',      label: 'Relatórios'           },
  ],
  multiplicadora: [
    { href: '/dashboard',    label: 'Dashboard'   },
    { href: '/minhas-rodas', label: 'Minhas Rodas' },
    { href: '/meu-perfil',   label: 'Meu Perfil'  },
  ],
  publico: [],
}

const labelPorPerfil: Record<string, string> = {
  administrador: 'Admin Nacional',
  coordenador:   'Coordenador',
  multiplicadora:'Multiplicadora',
  publico:       '',
}

export function TopNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const { usuario, loading, logout } = usePerfil()
  const [menuOpen, setMenuOpen] = useState(false)

  if (loading || !usuario) return null

  const nav = navPorPerfil[usuario.perfil] ?? []

  function handleSair() {
    logout()
    router.push('/entrar')
  }

  function handleNavClick() {
    setMenuOpen(false)
  }

  const initials = usuario.nome.split(' ').map(n => n[0]).slice(0, 2).join('')

  return (
    <>
      <header
        className="shrink-0 z-40"
        style={{ background: 'linear-gradient(135deg, #E91E8C 0%, #7B1FA2 100%)' }}
      >
        <div className="h-14 flex items-center px-4 sm:px-6 gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="text-white font-heading font-bold text-sm sm:text-base shrink-0">
            Grupo Mulheres do Brasil
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {nav.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                    active
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* User + Sair — desktop */}
          <div className="hidden md:flex items-center gap-2 shrink-0 ml-auto">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-sm text-white">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <span className="hidden lg:inline max-w-36 truncate">
                {usuario.nome.split(' ')[0]} — {labelPorPerfil[usuario.perfil]}
              </span>
              <span className="lg:hidden">{usuario.nome.split(' ')[0]}</span>
            </div>
            <button
              onClick={handleSair}
              aria-label="Sair da conta"
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm border border-white/30 hover:border-white/60 rounded-full px-3 py-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden ml-auto p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5 text-white" aria-hidden="true" /> : <Menu className="w-5 h-5 text-white" aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col"
          style={{ background: 'linear-gradient(135deg, #E91E8C 0%, #7B1FA2 100%)' }}
        >
          {/* Header do menu */}
          <div className="h-14 flex items-center px-4 justify-between shrink-0">
            <span className="text-white font-heading font-bold text-sm">Menu</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5 text-white" aria-hidden="true" />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{usuario.nome}</p>
                <p className="text-white/60 text-xs">{labelPorPerfil[usuario.perfil]}</p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {nav.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={handleNavClick}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center px-4 py-3.5 rounded-2xl text-base font-medium transition-colors',
                    active
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Sair */}
          <div className="px-4 py-6 border-t border-white/20">
            <button
              onClick={handleSair}
              aria-label="Sair da conta"
              className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl px-4 py-3.5 text-base font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>
      )}
    </>
  )
}
