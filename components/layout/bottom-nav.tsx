'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CheckCircle, BarChart2, Settings, CircleDot, UserCircle, MapPin, Upload, UserCog } from 'lucide-react'
import { usePerfil } from '@/lib/context/perfil-context'
import { cn } from '@/lib/utils'

const navPorPerfil = {
  administrador: [
    { href: '/dashboard',              label: 'Dashboard',       icon: LayoutDashboard },
    { href: '/admin/multiplicadoras',  label: 'Pessoas',         icon: Users           },
    { href: '/admin/usuarios',         label: 'Usuários',        icon: UserCog         },
    { href: '/relatorios',             label: 'Relatórios',      icon: BarChart2       },
    { href: '/admin/configuracoes',    label: 'Config.',         icon: Settings        },
  ],
  coordenador: [
    { href: '/dashboard',      label: 'Dashboard',  icon: LayoutDashboard },
    { href: '/municipios',     label: 'Municípios',  icon: MapPin          },
    { href: '/validacao',      label: 'Validação',   icon: CheckCircle     },
    { href: '/importar-rodas', label: 'Importar',    icon: Upload          },
    { href: '/relatorios',     label: 'Relatórios',  icon: BarChart2       },
  ],
  multiplicadora: [
    { href: '/dashboard',    label: 'Início',    icon: LayoutDashboard },
    { href: '/minhas-rodas', label: 'Rodas',     icon: CircleDot       },
    { href: '/meu-perfil',  label: 'Perfil',     icon: UserCircle      },
  ],
  publico: [],
}

export function BottomNav() {
  const pathname = usePathname()
  const { usuario } = usePerfil()

  if (!usuario) return null

  const items = navPorPerfil[usuario.perfil] ?? []
  if (items.length === 0) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon aria-hidden="true" className={cn('w-5 h-5 shrink-0', active && 'stroke-[2.5px]')} />
              <span className="leading-none">{label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
