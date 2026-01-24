type Factors = {
  morning: number;
  midday: number;
  evening: number;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function TimeOfDayBackground() {
  const factors: Factors = { morning: 0, midday: 0, evening: 1 };

  return (
    <div className="fixed inset-0 -z-50 pointer-events-none">
      {/* Base */}
      <div className="absolute inset-0" style={{ background: "#1C1A18" }} />

      {/* Morning glow */}
      <div
        className="absolute inset-0"
        style={{
          opacity: clamp(factors.morning * 0.9),
          background: `
            radial-gradient(
              1200px 600px at 50% -10%,
              rgba(255, 200, 140, 0.35),
              transparent 60%
            )
          `,
        }}
      />

      {/* Midday clean warmth */}
      <div
        className="absolute inset-0"
        style={{
          opacity: clamp(factors.midday * 0.7),
          background: `
            linear-gradient(
              to bottom,
              rgba(255, 210, 160, 0.18),
              transparent 55%
            )
          `,
        }}
      />

      {/* Evening intensity */}
      <div
        className="absolute inset-0"
        style={{
          opacity: clamp(factors.evening),
          background: `
            radial-gradient(
              1100px 800px at 30% 85%,
              rgba(255, 150, 85, 0.45),
              rgba(28, 26, 24, 0.85) 65%,
              rgba(28, 26, 24, 0.98) 85%
            )
          `,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              circle at center,
              transparent 55%,
              rgba(0,0,0,0.45) 100%
            )
          `,
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml;utf8,` +
            `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>` +
            `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/></filter>` +
            `<rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }}
      />
    </div>
  );
}
