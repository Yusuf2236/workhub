import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "WZone — O'zbekistondagi ish va vakansiyalar platformasi";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: 'linear-gradient(135deg, #0b0f19 0%, #1e3a8a 55%, #2563eb 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'white',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 900,
            }}
          >
            W
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 42, fontWeight: 800 }}>WZone</div>
            <div style={{ fontSize: 22, opacity: 0.85 }}>Ish va faoliyat portali</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.15, maxWidth: 980 }}>
            Oʻzbekistondagi zamonaviy ish va vakansiyalar
          </div>
          <div style={{ fontSize: 28, opacity: 0.9, maxWidth: 900 }}>
            OneID · Google · AI rezyume · Real-vaqt vakansiyalar
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 24, opacity: 0.85 }}>wzone.uz</div>
          <div
            style={{
              padding: '12px 22px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.15)',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            Index-ready 2026
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
