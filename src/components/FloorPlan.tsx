import { ArrowUpRight, MoveUpRight } from 'lucide-react'
import { getAreas } from '../lib/studio'
import type { CabinDesign } from '../types'

export default function FloorPlan({ design }: { design: CabinDesign }) {
  const scale = 52
  const width = design.length * scale
  const depth = design.width * scale
  const deckWidth = design.terraceWidth * scale
  const deckDepth = design.terraceDepth * scale
  const x = 65
  const y = 55
  const split = x + width * 0.62
  const bathroomDepth = depth * 0.35
  const areas = getAreas(design)
  return (
    <section className="panel floor-plan-section" aria-labelledby="floor-plan-title">
      <div className="section-heading">
        <div><span className="eyebrow">THE SPACE, AT A GLANCE</span><h2 id="floor-plan-title">Room to slow down.</h2></div>
        <span className="quiet-tag"><MoveUpRight size={13} /> Preliminary floor plan</span>
      </div>
      <div className="floor-plan-layout">
        <div className="floor-plan-drawing">
          <svg role="img" aria-label={`Preliminary floor plan: ${design.length} by ${design.width} metres, with ${areas.terrace.toFixed(1)} square metre terrace`} viewBox={`0 0 ${width + 130} ${depth + deckDepth + 125}`}>
            <defs><pattern id="deck-lines" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0V12" stroke="#c6b59b" strokeWidth="1" /></pattern></defs>
            <g fill="none" stroke="#a8aba1" strokeWidth="1">
              <path d={`M${x} ${y - 24}H${x + width}M${x} ${y - 30}V${y - 18}M${x + width} ${y - 30}V${y - 18}`} />
              <path d={`M${x + width + 24} ${y}V${y + depth}M${x + width + 18} ${y}H${x + width + 30}M${x + width + 18} ${y + depth}H${x + width + 30}`} />
            </g>
            <g fill="#697267" fontSize="12" fontFamily="inherit"><text x={x + width / 2} y={y - 32} textAnchor="middle">{design.length.toFixed(1)} m</text><text x={x + width + 39} y={y + depth / 2} textAnchor="middle" transform={`rotate(90,${x + width + 39},${y + depth / 2})`}>{design.width.toFixed(1)} m</text></g>
            <rect x={x + (width - deckWidth) / 2} y={y + depth} width={deckWidth} height={deckDepth} fill="#dfd4c0" stroke="#a88c62" strokeWidth="1.5" />
            <rect x={x + (width - deckWidth) / 2} y={y + depth} width={deckWidth} height={deckDepth} fill="url(#deck-lines)" />
            <rect x={x} y={y} width={width} height={depth} fill="#fbfaf6" stroke="#435245" strokeWidth="7" />
            <rect x={split} y={y + 4} width={width * 0.38 - 4} height={bathroomDepth} fill="#e8ece6" />
            <path d={`M${split} ${y}V${y + depth * 0.48}M${split} ${y + depth * 0.68}V${y + depth}M${split} ${y + bathroomDepth}H${split + 15}M${split + 48} ${y + bathroomDepth}H${x + width}`} stroke="#435245" strokeWidth="4" fill="none" />
            <path d={`M${split + 15} ${y + bathroomDepth}v33q33 0 33 -33`} stroke="#afbaac" fill="none" />
            <path d={`M${split} ${y + depth * 0.48}q${-depth * 0.2} 0 ${-depth * 0.2} ${depth * 0.2}H${split}`} stroke="#afbaac" fill="none" />
            <path d={`M${x + width * 0.12} ${y + depth}H${x + width * 0.5}`} stroke="#b2d0cb" strokeWidth="7" />
            <path d={`M${x + width} ${y + depth * 0.53}V${y + depth * 0.84}`} stroke="#b2d0cb" strokeWidth="7" />
            <g fill="#e5dfd2" stroke="#9eab9a" strokeWidth="1.2">
              <rect x={x + 12} y={y + 12} width={width * 0.37} height="29" rx="2" />
              <rect x={x + 12} y={y + 12} width="28" height={depth * 0.34} rx="2" />
              <rect x={x + width * 0.12} y={y + depth * 0.58} width={width * 0.24} height={depth * 0.14} rx="7" />
              <rect x={x + width * 0.12} y={y + depth * 0.67} width="10" height={depth * 0.11} rx="3" />
              <rect x={x + width * 0.12 + width * 0.24 - 10} y={y + depth * 0.67} width="10" height={depth * 0.11} rx="3" />
              <rect x={split + width * 0.075} y={y + depth * 0.6} width={width * 0.22} height={depth * 0.3} rx="3" />
              <rect x={split + width * 0.09} y={y + depth * 0.62} width={width * 0.085} height={depth * 0.065} rx="3" fill="#faf8f0" />
              <rect x={split + width * 0.19} y={y + depth * 0.62} width={width * 0.085} height={depth * 0.065} rx="3" fill="#faf8f0" />
              <rect x={x + width - 47} y={y + 9} width="36" height="35" rx="2" fill="#f4f5f0" />
              <circle cx={split + 25} cy={y + 25} r="10" fill="#f4f5f0" />
              <circle cx={x + width * 0.43} cy={y + depth * 0.38} r={depth * 0.065} fill="#d6c8ae" />
            </g>
            <g fill="#51604e" fontSize="11" fontFamily="inherit" textAnchor="middle">
              <text x={x + width * 0.3} y={y + depth * 0.24}>KITCHEN + DINING</text>
              <text x={x + width * 0.3} y={y + depth * 0.9}>LIVING</text>
              <text x={split + width * 0.19} y={y + depth * 0.27}>BATHROOM</text>
              <text x={split + width * 0.19} y={y + depth * 0.48}>BEDROOM</text>
              <text x={x + width / 2} y={y + depth + deckDepth / 2 + 4}>TERRACE · {areas.terrace.toFixed(1)} m²</text>
              <text x={x + width / 2} y={y + depth + deckDepth + 29} fill="#8a8c80">FOREST-FACING SIDE</text>
            </g>
          </svg>
        </div>
        <div className="plan-notes">
          <span className="eyebrow">ONE BEDROOM. MANY POSSIBILITIES.</span>
          <p>A quiet bedroom, a generous shared living space, and a little terrace made for two.</p>
          <div className="plan-area-row"><span>Gross enclosed</span><strong>{areas.enclosed.toFixed(1)} m²</strong></div>
          <div className="plan-area-row"><span>Open terrace</span><strong>{areas.terrace.toFixed(1)} m²</strong></div>
          <div className="plan-area-row total"><span>Total proposed</span><strong>{areas.total.toFixed(1)} m²</strong></div>
          <p className="fine-print">Gross areas use exterior dimensions. Estimated clear area: {areas.estimatedNet.toFixed(1)} m², allowing for 150 mm outer walls and indicative partitions. Structure may reduce it further. Room layout is schematic and not editable in this starter.</p>
          <div className="subtle-note"><ArrowUpRight size={17} /><span>Dimensions are a concept to discuss with your architect, not construction instructions.</span></div>
        </div>
      </div>
    </section>
  )
}
