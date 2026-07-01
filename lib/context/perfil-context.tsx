'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { UsuarioAtual } from '@/lib/types'
import { IS_MOCK_MODE } from '@/lib/api/client'
import { loginApi, getMeApi, logoutApi } from '@/lib/api/auth'
import { usuariosDemo } from '@/lib/data/mock'

interface PerfilContextValue {
  usuario: UsuarioAtual | null
  loading: boolean
  login: (email: string, senha: string) => Promise<{ error?: string }>
  logout: () => void
}

const PerfilContext = createContext<PerfilContextValue | null>(null)

const LS_TOKEN = 'gmb_token'
const LS_MOCK  = 'gmb_usuario_key'

// Credenciais apenas para desenvolvimento local — nunca devem chegar a produção
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL é obrigatória em produção. Mock mode não é permitido.')
}

const MOCK_CREDS = [
  { email: 'admin@gmb.org',       senha: 'admin123',  key: 'administrador'             },
  { email: 'ana@gmb.org',         senha: 'coord123',  key: 'coordenador'               },
  { email: 'mult1@example.com',   senha: 'mult123',   key: 'multiplicadora_formada'    },
  { email: 'mult4@example.com',   senha: 'mult123',   key: 'multiplicadora_em_formacao' },
  { email: 'mult3@example.com',   senha: 'mult123',   key: 'multiplicadora_aguardando'  },
] as const

export function PerfilProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAtual | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (IS_MOCK_MODE) {
      const saved = localStorage.getItem(LS_MOCK)
      if (saved && saved in usuariosDemo) {
        setUsuario(usuariosDemo[saved as keyof typeof usuariosDemo])
      }
      setLoading(false)
      return
    }

    const token = localStorage.getItem(LS_TOKEN)
    if (!token) { setLoading(false); return }

    getMeApi()
      .then(res => setUsuario(res.usuario))
      .catch(() => localStorage.removeItem(LS_TOKEN))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, senha: string): Promise<{ error?: string }> {
    if (IS_MOCK_MODE) {
      const cred = MOCK_CREDS.find(
        c => c.email.toLowerCase() === email.toLowerCase().trim() && c.senha === senha
      )
      if (!cred) return { error: 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.' }
      localStorage.setItem(LS_MOCK, cred.key)
      setUsuario(usuariosDemo[cred.key])
      return {}
    }

    try {
      const res = await loginApi(email, senha)
      localStorage.setItem(LS_TOKEN, res.token)
      setUsuario(res.usuario)
      return {}
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Erro ao fazer login' }
    }
  }

  function logout() {
    if (IS_MOCK_MODE) {
      localStorage.removeItem(LS_MOCK)
    } else {
      logoutApi().catch(() => {})
      localStorage.removeItem(LS_TOKEN)
    }
    setUsuario(null)
  }

  return (
    <PerfilContext value={{ usuario, loading, login, logout }}>
      {children}
    </PerfilContext>
  )
}

export function usePerfil() {
  const ctx = useContext(PerfilContext)
  if (!ctx) throw new Error('usePerfil must be used inside PerfilProvider')
  return ctx
}
