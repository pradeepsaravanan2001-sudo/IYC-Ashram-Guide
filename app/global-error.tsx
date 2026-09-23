'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Georgia, serif', padding: '48px 24px', background: '#f6f5f0', color: '#26332d' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Something went wrong</h2>
          <p style={{ color: '#728078', fontSize: '14px', marginBottom: '24px' }}>
            A temporary pause in rhythm. Please try reloading the experience.
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
      </body>
    </html>
  )
}
