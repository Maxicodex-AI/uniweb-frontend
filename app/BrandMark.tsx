// app/BrandMark.tsx
//
// The TETFund logo on a white rounded badge, so its dark lettering stays
// readable on the dark green headers. Shows a 🛺 when BRAND.logo is null.

import { BRAND } from './brand'

export default function BrandMark({ height = 40 }: { height?: number }) {
  if (!BRAND.logo) {
    return <span style={{ fontSize: Math.round(height * 0.9) }}>🛺</span>
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#ffffff',
        borderRadius: 10,
        padding: '4px 10px',
        boxShadow: '0 1px 4px rgba(0,0,0,.25)',
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND.logo} alt={BRAND.owner} style={{ height, width: 'auto', display: 'block' }} />
    </span>
  )
}