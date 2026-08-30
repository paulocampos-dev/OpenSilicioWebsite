/**
 * The "sheet header" bar (`.title-block`) used atop drawn panels, e.g.
 * "Acesso rápido — por onde começar / Folha 01". Not to be confused with
 * the Design canvas's own per-artboard label bars, which are documentation
 * chrome and never appear on the live site.
 */
export default function TitleBlockBar({ title, cells = [] }: { title: string; cells?: string[] }) {
  return (
    <div className="title-block">
      <span className="tb-title">{title}</span>
      {cells.map((cell) => (
        <span key={cell} className="tb-cell">{cell}</span>
      ))}
    </div>
  )
}
