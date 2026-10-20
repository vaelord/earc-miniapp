import { memo, type HTMLAttributes, type PropsWithChildren } from 'react'

type GlassPanelProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  as?: 'div' | 'section'
}

function GlassPanelBase({ as = 'div', children, className = '', ...props }: GlassPanelProps) {
  const classNames = `glass-panel ${className}`.trim()
  if (as === 'section') {
    return <section className={classNames} {...props}>{children}</section>
  }
  return <div className={classNames} {...props}>{children}</div>
}

export const GlassPanel = memo(GlassPanelBase)
GlassPanel.displayName = 'GlassPanel' 