const toneMap = {
  accent: { background: 'var(--color-accent)', bar: 'var(--color-accent)' },
  success: { background: 'rgba(18, 184, 134, 0.12)', bar: 'var(--color-success)' },
  warning: { background: 'rgba(245, 166, 35, 0.12)', bar: 'var(--color-warning)' },
  danger: { background: 'rgba(229, 72, 77, 0.12)', bar: 'var(--color-danger)' },
  neutral: { background: 'var(--color-border)', bar: 'var(--color-text-primary)' },
}

const ProgressBar = ({ value = 0, max = 100, tone = 'accent', className = '', style }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      className={['ui-progress-bar', className].filter(Boolean).join(' ')}
      style={{
        width: '100%',
        height: '10px',
        background: toneMap[tone]?.background || toneMap.accent.background,
        borderRadius: '999px',
        overflow: 'hidden',
        ...(style || {}),
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          background: toneMap[tone]?.bar || toneMap.accent.bar,
          borderRadius: 'inherit',
          transition: 'width 0.2s ease',
        }}
      />
    </div>
  )
}

export default ProgressBar
