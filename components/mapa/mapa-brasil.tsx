'use client'

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import type { GeoPermissibleObjects } from 'd3-geo'
import { Plus, Minus, LocateFixed } from 'lucide-react'

interface Ponto {
  cidade: string
  estado: string
  lat: number
  lng: number
  multiplicadoras: number
  rodas: number
  status: 'ativo' | 'concluido'
}

const pontos: Ponto[] = [
  { cidade: 'Fortaleza',         estado: 'CE', lat: -3.72,   lng: -38.54, multiplicadoras: 3, rodas: 12, status: 'ativo' },
  { cidade: 'Sobral',            estado: 'CE', lat: -3.69,   lng: -40.35, multiplicadoras: 1, rodas: 4,  status: 'ativo' },
  { cidade: 'Juazeiro do Norte', estado: 'CE', lat: -7.21,   lng: -39.32, multiplicadoras: 1, rodas: 3,  status: 'concluido' },
  { cidade: 'Crato',             estado: 'CE', lat: -7.23,   lng: -39.41, multiplicadoras: 1, rodas: 2,  status: 'concluido' },
  { cidade: 'Maracanaú',         estado: 'CE', lat: -3.87,   lng: -38.63, multiplicadoras: 1, rodas: 2,  status: 'concluido' },
  { cidade: 'Tianguá',           estado: 'CE', lat: -3.73,   lng: -40.99, multiplicadoras: 1, rodas: 3,  status: 'concluido' },
  { cidade: 'Campinas',          estado: 'SP', lat: -22.91,  lng: -47.06, multiplicadoras: 1, rodas: 3,  status: 'ativo' },
  { cidade: 'Salvador',          estado: 'BA', lat: -12.97,  lng: -38.50, multiplicadoras: 1, rodas: 5,  status: 'ativo' },
]

const W = 800
const H = 860
const DEFAULT_TRANSFORM = { x: 0, y: 0, k: 1 }
const MIN_ZOOM = 0.5
const MAX_ZOOM = 12
const ZOOM_STEP = 1.4

// Projeção e path generator são constantes — fora do componente para nunca recomputar
const projection = geoMercator()
  .center([-52, -16])
  .scale(760)
  .translate([W / 2 + 50, H / 2])

const pathGen = geoPath().projection(projection)

function toXY(lat: number, lng: number) {
  const coords = projection([lng, lat])
  return coords ? { x: coords[0], y: coords[1] } : { x: 0, y: 0 }
}

// Posições dos marcadores pré-computadas (constantes)
const MARKER_POSITIONS = pontos.map(p => ({ ...p, ...toXY(p.lat, p.lng) }))

interface Transform { x: number; y: number; k: number }

interface Props {
  focusEstado?: string
  focusMunicipio?: string
  onCidadeClick?: (cidade: string, estado: string) => void
}

// Sub-componente memoizado para os estados — só re-renderiza quando geoData muda
const EstadosPaths = memo(function EstadosPaths({ geoData }: { geoData: GeoPermissibleObjects[] }) {
  return (
    <>
      {geoData.map((feature, i) => (
        <path
          key={i}
          d={pathGen(feature) ?? ''}
          fill="#F0F7E6"
          stroke="#A8C89A"
          strokeWidth={0.8}
          vectorEffect="non-scaling-stroke"
          aria-hidden="true"
        />
      ))}
    </>
  )
})

export function MapaBrasil({ focusEstado, focusMunicipio, onCidadeClick }: Props) {
  const [geoData, setGeoData] = useState<GeoPermissibleObjects[] | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!focusEstado) {
      setTransform(DEFAULT_TRANSFORM)
      return
    }
    const alvos = focusMunicipio
      ? MARKER_POSITIONS.filter(p => p.estado === focusEstado && p.cidade === focusMunicipio)
      : MARKER_POSITIONS.filter(p => p.estado === focusEstado)

    if (alvos.length === 0) return

    const cx = alvos.reduce((s, p) => s + p.x, 0) / alvos.length
    const cy = alvos.reduce((s, p) => s + p.y, 0) / alvos.length
    const k = focusMunicipio ? 5 : 3

    setTransform({ k, x: W / 2 - k * cx, y: H / 2 - k * cy })
  }, [focusEstado, focusMunicipio])

  useEffect(() => {
    fetch('/brazil-states.geojson')
      .then(r => r.json())
      .then((d: { features: GeoPermissibleObjects[] }) => setGeoData(d.features))
      .catch(console.error)
  }, [])

  const zoomAt = useCallback((delta: number, cx: number, cy: number) => {
    setTransform(prev => {
      const newK = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.k * delta))
      const ratio = newK / prev.k
      return { k: newK, x: cx - ratio * (cx - prev.x), y: cy - ratio * (cy - prev.y) }
    })
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const cx = (e.clientX - rect.left) * (W / rect.width)
    const cy = (e.clientY - rect.top) * (H / rect.height)
    zoomAt(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, cx, cy)
  }, [zoomAt])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return
    dragStart.current = { mx: e.clientX, my: e.clientY, tx: transform.x, ty: transform.y }
    setDragging(true)
  }, [transform.x, transform.y])

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const start = dragStart.current
    if (!start) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const dx = (e.clientX - start.mx) * (W / rect.width)
    const dy = (e.clientY - start.my) * (H / rect.height)
    setTransform(prev => ({ ...prev, x: start.tx + dx, y: start.ty + dy }))
  }, [])

  const onMouseUp = useCallback(() => {
    dragStart.current = null
    setDragging(false)
  }, [])

  const lastTouch = useRef<{ x: number; y: number; dist: number } | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouch.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.sqrt(dx * dx + dy * dy),
      }
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg || !lastTouch.current) return
    const rect = svg.getBoundingClientRect()
    const sx = W / rect.width
    const sy = H / rect.height
    if (e.touches.length === 1) {
      const dx = (e.touches[0].clientX - lastTouch.current.x) * sx
      const dy = (e.touches[0].clientY - lastTouch.current.y) * sy
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const cx = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) * sx
      const cy = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) * sy
      if (lastTouch.current.dist > 0) {
        zoomAt(dist / lastTouch.current.dist, cx, cy)
      }
      lastTouch.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist,
      }
    }
  }

  const zoomIn = useCallback(() => zoomAt(ZOOM_STEP, W / 2, H / 2), [zoomAt])
  const zoomOut = useCallback(() => zoomAt(1 / ZOOM_STEP, W / 2, H / 2), [zoomAt])
  const resetView = useCallback(() => setTransform(DEFAULT_TRANSFORM), [])

  const t = transform
  const groupTransform = `translate(${t.x}, ${t.y}) scale(${t.k})`

  // Marcadores memoizados — só re-renderizam quando hovered ou t.k muda
  const markers = useMemo(() => MARKER_POSITIONS.map(p => {
    const r = (8 + p.multiplicadoras * 3) / t.k
    const cor = p.status === 'ativo' ? '#E91E8C' : '#7B1FA2'
    const tooltipId = `tooltip-${p.cidade.replace(/\s+/g, '-').toLowerCase()}`
    const isHov = hovered === p.cidade
    return { ...p, r, cor, tooltipId, isHov }
  }), [t.k, hovered])

  return (
    <div className="relative w-full h-full bg-[#D4E9F7] overflow-hidden select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        style={{ display: 'block', cursor: dragging ? 'grabbing' : 'grab', willChange: 'transform' }}
        role="img"
        aria-label="Mapa do Brasil com marcadores de multiplicadores"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { lastTouch.current = null }}
      >
        <rect x="0" y="0" width={W} height={H} fill="#D4E9F7" />

        <g transform={groupTransform}>
          {geoData && <EstadosPaths geoData={geoData} />}

          {markers.map(p => (
            <g
              key={p.cidade}
              role="button"
              tabIndex={0}
              aria-label={`Ver multiplicadores em ${p.cidade}`}
              aria-describedby={p.isHov ? p.tooltipId : undefined}
              onMouseEnter={() => setHovered(p.cidade)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => { e.stopPropagation(); onCidadeClick?.(p.cidade, p.estado) }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCidadeClick?.(p.cidade, p.estado) } }}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              {p.status === 'ativo' && (
                <circle cx={p.x} cy={p.y} r={p.r + 7 / t.k} fill={p.cor} opacity="0.18" />
              )}
              <circle
                cx={p.x} cy={p.y}
                r={p.isHov ? p.r + 3 / t.k : p.r}
                fill={p.cor}
                fillOpacity={0.88}
                stroke="white"
                strokeWidth={2.5 / t.k}
                style={{ transition: 'r 0.15s ease' }}
              />

              {p.isHov && (
                <g id={p.tooltipId} role="tooltip">
                  <rect
                    x={p.x + 20 / t.k} y={p.y - 118 / t.k}
                    width={230 / t.k} height={126 / t.k}
                    rx={12 / t.k} fill="white"
                    filter="drop-shadow(0 6px 20px rgba(0,0,0,0.16))"
                    stroke="#E8E8E8" strokeWidth={0.8 / t.k}
                  />
                  <text x={p.x + 36 / t.k} y={p.y - 86 / t.k} fontSize={16 / t.k} fontWeight="700" fill="#1A1A2E">
                    {p.cidade} — {p.estado}
                  </text>
                  <text x={p.x + 36 / t.k} y={p.y - 60 / t.k} fontSize={14 / t.k} fill="#E91E8C">
                    👩 {p.multiplicadoras} multiplicador{p.multiplicadoras > 1 ? 'es' : ''}
                  </text>
                  <text x={p.x + 36 / t.k} y={p.y - 36 / t.k} fontSize={14 / t.k} fill="#7B1FA2">
                    🎯 {p.rodas} rodas realizadas
                  </text>
                  <text x={p.x + 36 / t.k} y={p.y - 12 / t.k} fontSize={14 / t.k}
                    fill={p.status === 'ativo' ? '#2E7D32' : '#1565C0'}>
                    {p.status === 'ativo' ? '● Roda ativa' : '● Concluído'}
                  </text>
                </g>
              )}
            </g>
          ))}
        </g>
      </svg>

      {/* Controles de zoom */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-1.5 z-10">
        <button onClick={zoomIn} className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all border border-gray-200" title="Zoom in" aria-label="Ampliar mapa">
          <Plus className="w-4 h-4 text-gray-700" />
        </button>
        <button onClick={zoomOut} className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all border border-gray-200" title="Zoom out" aria-label="Reduzir mapa">
          <Minus className="w-4 h-4 text-gray-700" />
        </button>
        <button onClick={resetView} className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all border border-gray-200 mt-1" title="Resetar visão" aria-label="Resetar zoom">
          <LocateFixed className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      {!geoData && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#D4E9F7]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Carregando mapa...</p>
          </div>
        </div>
      )}
    </div>
  )
}
