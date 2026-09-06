export default function ErrorState({
  title = 'Something went wrong',
  message = 'Failed to load data. Please try again.',
  onRetry,
  icon = '⚠️',
}: {
  title?: string
  message?: string
  onRetry?: () => void
  icon?: string
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, maxWidth: 360, lineHeight: 1.6 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: '#16a34a', color: 'white',
            border: 'none', borderRadius: 8,
            padding: '10px 24px', cursor: 'pointer',
            fontWeight: 700, fontSize: 14,
          }}
        >
          Try Again →
        </button>
      )}
    </div>
  )
}