'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardCoordenacao } from '@/components/dashboard/dashboard-coordenacao'
import { DashboardMultiplicador } from '@/components/dashboard/dashboard-multiplicador'
import { DashboardAdmin } from '@/components/dashboard/dashboard-admin'
import { usePerfil } from '@/lib/context/perfil-context'

export default function DashboardPage() {
  const { usuario, loading } = usePerfil()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !usuario) router.replace('/entrar')
  }, [usuario, loading, router])

  // Aguarda restauração do localStorage
  if (loading) return (
    <div className="flex-1 flex items-center justify-center" aria-live="polite" aria-busy="true">
      <div role="status" aria-label="Carregando dashboard..." className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!usuario) return null

  if (usuario.perfil === 'administrador') return <DashboardAdmin />
  if (usuario.perfil === 'coordenador') return <DashboardCoordenacao />
  return <DashboardMultiplicador />
}
