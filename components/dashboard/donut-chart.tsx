'use client'

interface Props {
  data: { name: string; value: number; cor: string }[]
  size?: number
}

export function DonutChart({ data, size = 140 }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.36
  const strokeW = size * 0.22
  const GAP_DEG = 4

  let cumAngle = -90
  const segments = data.map(d => {
    const angle = (d.value / total) * 360
    const start = cumAngle + GAP_DEG / 2
    const end = cumAngle + angle - GAP_DEG / 2
    cumAngle += angle
    return { ...d, startAngle: start, endAngle: end }
  })

  function arc(startAngle: number, endAngle: number) {
    const toRad = (a: number) => (a * Math.PI) / 180
    const x1 = cx + r * Math.cos(toRad(startAngle))
    const y1 = cy + r * Math.sin(toRad(startAngle))
    const x2 = cx + r * Math.cos(toRad(endAngle))
    const y2 = cy + r * Math.sin(toRad(endAngle))
    const large = endAngle - startAngle > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label="Gráfico de distribuição por status">
      <title>Gráfico de distribuição por status</title>
      {/* Trilha cinza */}
      <circle aria-hidden="true" cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
      {/* Segmentos */}
      {segments.map((seg, i) => (
        <path
          aria-hidden="true"
          key={i}
          d={arc(seg.startAngle, seg.endAngle)}
          fill="none"
          stroke={seg.cor}
          strokeWidth={strokeW}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  )
}
