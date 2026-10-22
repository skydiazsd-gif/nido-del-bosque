import { ArrowUpRight, CircleAlert, Coins, Wallet } from 'lucide-react'
import type { BudgetItem, CabinDesign } from '../types'
import { BUDGET_LIMIT, formatCOP, getAreas } from '../lib/studio'

interface BudgetPanelProps {
  items: BudgetItem[]
  onChange: (items: BudgetItem[]) => void
  design: CabinDesign
}

export default function BudgetPanel({ items, onChange, design }: BudgetPanelProps) {
  const total = items.reduce((sum, item) => sum + item.amount, 0)
  const remaining = BUDGET_LIMIT - total
  const percent = (total / BUDGET_LIMIT) * 100
  const area = getAreas(design).total

  function updateAmount(id: string, rawValue: string) {
    const value = Number(rawValue)
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000_000) return
    onChange(items.map((item) => item.id === id ? { ...item, amount: value } : item))
  }

  return (
    <section className="budget-panel" aria-labelledby="budget-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">The investment</p>
          <h2 id="budget-heading">Make room for possibility.</h2>
          <p className="muted">An editable starting framework for an all-in COP 80 million ceiling.</p>
        </div>
        <span className="section-tag"><Coins size={14} /> Colombian pesos</span>
      </div>

      <div className="budget-summary">
        <div className="budget-stat budget-stat-primary">
          <span className="stat-label"><Wallet size={16} /> Planned expenditure</span>
          <strong data-testid="budget-total">{formatCOP(total)}</strong>
          <span>of {formatCOP(BUDGET_LIMIT)} available</span>
        </div>
        <div className={`budget-stat ${remaining < 0 ? 'is-over' : ''}`}>
          <span className="stat-label">{remaining < 0 ? 'Above the ceiling' : 'Remaining allocation'}</span>
          <strong data-testid="budget-remaining">{formatCOP(Math.abs(remaining))}</strong>
          <span>{percent.toFixed(1)}% allocated</span>
        </div>
        <div className="budget-stat">
          <span className="stat-label"><ArrowUpRight size={16} /> Allocation per m²</span>
          <strong>{formatCOP(area > 0 ? total / area : 0)}</strong>
          <span>across {area.toFixed(1)} m² gross incl. balcony & landing</span>
        </div>
      </div>

      <div className="budget-progress" role="progressbar" aria-label="Budget allocated" aria-valuenow={Math.min(percent, 100)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${percent.toFixed(1)} percent allocated`}>
        <div style={{ width: `${Math.min(percent, 100)}%`, background: remaining < 0 ? '#a45e43' : undefined }} />
      </div>

      <div className="notice budget-notice" role={remaining < 0 ? 'alert' : undefined}>
        <CircleAlert size={18} />
        <p>{remaining < 0 && <strong>The current allocation exceeds the COP 80M ceiling. </strong>}These are reverse-budget placeholders, not supplier quotes. The elevated design’s affordability is unresolved. Replace each allowance with an itemised local quote; keep contingency and professional fees in scope.</p>
      </div>

      <div className="budget-table-wrap">
        <table className="budget-table">
          <thead><tr><th scope="col">Scope of work</th><th scope="col">Allocation · COP</th><th scope="col">Share</th></tr></thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <th scope="row"><span className="row-number">{String(index + 1).padStart(2, '0')}</span>{item.label}</th>
                <td><input type="number" min={0} max={1_000_000_000_000} step={100_000} inputMode="numeric" aria-label={`${item.label} cost`} value={item.amount} onChange={(event) => updateAmount(item.id, event.target.value)} /></td>
                <td className="budget-share">{total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><th scope="row">Total estimated allocation</th><td>{formatCOP(total)}</td><td>{percent.toFixed(1)}% of ceiling</td></tr></tfoot>
        </table>
      </div>
      <p className="panel-footnote">Saved in this browser with your design. This framework does not establish that the full cabin can be delivered for COP 80M.</p>
    </section>
  )
}
