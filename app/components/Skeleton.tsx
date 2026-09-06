export function SkeletonCard() {
  return (
    <div style={{
      background: 'white', borderRadius: 14,
      padding: 20, border: '1px solid #f3f4f6',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-pulse {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 1000px 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
      `}</style>
      <div className="skeleton-pulse" style={{ height: 16, width: '60%', marginBottom: 10 }} />
      <div className="skeleton-pulse" style={{ height: 12, width: '90%', marginBottom: 6 }} />
      <div className="skeleton-pulse" style={{ height: 12, width: '75%', marginBottom: 16 }} />
      <div className="skeleton-pulse" style={{ height: 36, width: '40%' }} />
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-pulse {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 1000px 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: 'white', borderRadius: 12, padding: '14px 16px',
          border: '1px solid #f3f4f6', display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <div className="skeleton-pulse" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton-pulse" style={{ height: 14, width: '50%', marginBottom: 6 }} />
            <div className="skeleton-pulse" style={{ height: 11, width: '80%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #f3f4f6' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-pulse {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 1000px 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
      `}</style>
      {/* Header */}
      <div style={{ background: '#f9fafb', padding: '12px 16px', display: 'flex', gap: 16, borderBottom: '1px solid #f3f4f6' }}>
        {[40, 25, 20, 15].map((w, i) => (
          <div key={i} className="skeleton-pulse" style={{ height: 12, width: `${w}%` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '14px 16px', display: 'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid #f9fafb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '40%' }}>
            <div className="skeleton-pulse" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
            <div className="skeleton-pulse" style={{ height: 12, flex: 1 }} />
          </div>
          <div className="skeleton-pulse" style={{ height: 12, width: '25%' }} />
          <div className="skeleton-pulse" style={{ height: 12, width: '20%' }} />
          <div className="skeleton-pulse" style={{ height: 24, width: '15%', borderRadius: 999 }} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCourse() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-pulse {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 1000px 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
      `}</style>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #f3f4f6' }}>
          <div className="skeleton-pulse" style={{ height: 80, borderRadius: 0 }} />
          <div style={{ padding: '14px 16px' }}>
            <div className="skeleton-pulse" style={{ height: 13, width: '70%', marginBottom: 8 }} />
            <div className="skeleton-pulse" style={{ height: 10, width: '50%', marginBottom: 12 }} />
            <div className="skeleton-pulse" style={{ height: 4, width: '100%', borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-pulse {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 1000px 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
      `}</style>

      {/* Banner */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '20px 24px' }}>
        <div className="skeleton-pulse" style={{ height: 20, width: '30%', marginBottom: 8 }} />
        <div className="skeleton-pulse" style={{ height: 14, width: '20%' }} />
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 12, padding: 16, display: 'flex', gap: 12 }}>
              <div className="skeleton-pulse" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-pulse" style={{ height: 20, width: '60%', marginBottom: 6 }} />
                <div className="skeleton-pulse" style={{ height: 11, width: '80%' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 14, padding: 20 }}>
              <div className="skeleton-pulse" style={{ height: 16, width: '50%', marginBottom: 16 }} />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} style={{ marginBottom: 12 }}>
                  <div className="skeleton-pulse" style={{ height: 12, width: '90%', marginBottom: 4 }} />
                  <div className="skeleton-pulse" style={{ height: 10, width: '60%' }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}