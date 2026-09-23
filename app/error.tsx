'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: '#2c4437', marginBottom: '12px' }}>
        Something went wrong
      </h2>
      <p style={{ color: '#728078', fontSize: '14px', marginBottom: '24px' }}>
        An unexpected error occurred. You may try refreshing the page.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          padding: '10px 20px',
          background: '#385b4a',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
