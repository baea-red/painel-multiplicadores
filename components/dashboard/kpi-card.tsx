interface KpiCardProps {
  label: string
  valor: number | string
  cor?: string
  icon?: string
}

const cores: Record<string, string> = {
  rosa: '#E91E8C',
  roxo: '#7B1FA2',
  azul: '#1565C0',
  verde: '#2E7D32',
  laranja: '#E65100',
  ciano: '#00838F',
}

const bgCirculo: Record<string, string> = {
  rosa: '#FCE4EC',
  roxo: '#F3E5F5',
  azul: '#E3F2FD',
  verde: '#E8F5E9',
  laranja: '#FFF3E0',
  ciano: '#E0F7FA',
}

export function KpiCard({ label, valor, cor = 'rosa', icon }: KpiCardProps) {
  const corHex = cores[cor] ?? cores.rosa
  const bgHex = bgCirculo[cor] ?? bgCirculo.rosa

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden" role="figure">
      <div
        aria-hidden="true"
        className="absolute -top-6 -right-6 w-24 sm:w-28 h-24 sm:h-28 rounded-full opacity-40"
        style={{ backgroundColor: bgHex }}
      />
      <div className="relative">
        <dl>
          <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 sm:mb-2 leading-tight">
            {icon && <span className="mr-1" aria-hidden="true">{icon}</span>}{label}
          </dt>
          <dd className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold" style={{ color: corHex }}>
            {valor}
          </dd>
        </dl>
      </div>
    </div>
  )
}
