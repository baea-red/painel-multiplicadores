'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePerfil } from '@/lib/context/perfil-context'

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { usuario, loading } = usePerfil()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !usuario) {
      router.replace('/entrar')
    }
  }, [loading, usuario, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Carregando...">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" aria-hidden="true" />
      </div>
    )
  }

  if (!usuario) return null

  return <>{children}</>
}
