import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 100,
          background: 'linear-gradient(135deg, #FFB5C5 0%, #FFDAB9 50%, #B5EAD7 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        ✏️
      </div>
    ),
    {
      ...size,
    }
  );
}
