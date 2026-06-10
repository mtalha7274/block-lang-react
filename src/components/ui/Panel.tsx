import './Panel.css'

interface PanelProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function Panel({ title, children, className = '' }: PanelProps) {
  return (
    <section className={`panel ${className}`.trim()}>
      {title && <header className="panel__header">{title}</header>}
      <div className="panel__body">{children}</div>
    </section>
  )
}
