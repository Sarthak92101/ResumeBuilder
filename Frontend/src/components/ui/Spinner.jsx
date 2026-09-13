const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 36,
  }

  const value = sizes[size] || sizes.md

  return (
    <div
      aria-label="Loading"
      role="status"
      style={{
        width: value,
        height: value,
        borderRadius: '50%',
        border: '2px solid var(--color-border)',
        borderTopColor: 'var(--color-accent)',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )
}

export default Spinner
