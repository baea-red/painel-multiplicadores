'use client'

import { useState } from 'react'

interface Props {
  data: { municipio: string; total: number }[]
  defaultVisible?: number
}

const barCores = ['#E91E8C', '#7B1FA2', '#5E35B1', '#AD1457', '#EC407A', '#AB47BC']
const DESKTOP_DEFAULT = 8
const MOBILE_DEFAULT = 5

export function BarChartMunicipios({ data, defaultVisible }: Props) {
  const max = Math.max(...data.map(d => d.total))
  const chartH = 180

  const desktopLimit = defaultVisible ?? DESKTOP_DEFAULT
  const mobileLimit = defaultVisible ?? MOBILE_DEFAULT

  const [desktopExpanded, setDesktopExpanded] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(false)

  const desktopData = desktopExpanded ? data : data.slice(0, desktopLimit)
  const mobileData = mobileExpanded ? data : data.slice(0, mobileLimit)

  const hasMoreDesktop = data.length > desktopLimit
  const hasMoreMobile = data.length > mobileLimit

  return (
    <div className="w-full">
      {/* Desktop: barras verticais */}
      <div className="hidden sm:block">
        <div role="img" aria-label="Gráfico de barras: rodas por município" className="flex items-end justify-around gap-2 px-2" style={{ height: chartH }}>
          {desktopData.map((d, i) => {
            const barH = Math.max((d.total / max) * (chartH - 28), 12)
            const cor = barCores[i % barCores.length]
            return (
              <div key={d.municipio} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                <span className="text-xs font-bold text-gray-600">{d.total}</span>
                <div aria-hidden="true" className="w-full rounded-t-xl transition-all duration-500" style={{ height: barH, backgroundColor: cor }} />
              </div>
            )
          })}
        </div>
        <div className="flex justify-around gap-2 px-2 mt-3 border-t border-gray-100 pt-3">
          {desktopData.map(d => (
            <div key={d.municipio} className="flex-1 text-center text-xs text-gray-400 min-w-0">
              <span className="block truncate">{d.municipio}</span>
            </div>
          ))}
        </div>
        {hasMoreDesktop && (
          <button
            onClick={() => setDesktopExpanded(e => !e)}
            aria-expanded={desktopExpanded}
            className="mt-3 w-full text-xs font-medium text-center py-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
          >
            {desktopExpanded ? `▲ Compactar (${data.length - desktopLimit} ocultos)` : `▼ Ver todos os ${data.length} municípios`}
          </button>
        )}
      </div>

      {/* Mobile: barras horizontais */}
      <div className="sm:hidden space-y-2.5">
        {mobileData.map((d, i) => {
          const pct = Math.max((d.total / max) * 100, 4)
          const cor = barCores[i % barCores.length]
          return (
            <div key={d.municipio} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-24 shrink-0 truncate text-right">{d.municipio}</span>
              <div aria-hidden="true" className="flex-1 h-7 bg-gray-100 rounded-xl overflow-hidden">
                <div
                  className="h-full rounded-xl flex items-center justify-end pr-2 transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: cor }}
                >
                  <span className="text-white text-xs font-bold leading-none">{d.total}</span>
                </div>
              </div>
            </div>
          )
        })}
        {hasMoreMobile && (
          <button
            onClick={() => setMobileExpanded(e => !e)}
            aria-expanded={mobileExpanded}
            className="w-full text-xs font-medium py-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
          >
            {mobileExpanded ? `▲ Compactar` : `▼ Ver todos os ${data.length} municípios`}
          </button>
        )}
      </div>
    </div>
  )
}
