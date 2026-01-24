type Factors = {
  morning: number;
  midday: number;
  evening: number;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function TimeOfDayBackground() {
  return (
    <div className="fixed inset-0 -z-50 pointer-events-none">
      {/* Base */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              180deg,
              #2b221c 0%,
              #1f1813 70%
            )
          `,
        }}
      />

      {/* Warm cafe glow */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.65,
          background: `
            radial-gradient(
              900px 520px at 40% 10%,
              rgba(255, 190, 130, 0.28),
              rgba(255, 150, 90, 0.12) 45%,
              transparent 70%
            )
          `,
        }}
      />

      {/* Lens flare streaks */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.45,
          background: `
            radial-gradient(
              140px 140px at 18% 18%,
              rgba(255, 210, 150, 0.55),
              rgba(255, 160, 95, 0.25) 45%,
              transparent 70%
            ),
            radial-gradient(
              90px 90px at 26% 24%,
              rgba(255, 180, 120, 0.45),
              transparent 70%
            ),
            linear-gradient(
              115deg,
              transparent 40%,
              rgba(255, 190, 130, 0.16) 50%,
              transparent 60%
            )
          `,
        }}
      />

      {/* Ember bloom */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.9,
          background: `
            radial-gradient(
              1100px 800px at 30% 85%,
              rgba(255, 150, 85, 0.4),
              rgba(62, 40, 28, 0.35) 55%,
              transparent 75%
            )
          `,
        }}
      />

      {/* Soft bokeh sparks */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.55,
          background: `
            radial-gradient(
              260px 180px at 78% 78%,
              rgba(255, 170, 95, 0.25),
              transparent 70%
            ),
            radial-gradient(
              220px 160px at 86% 88%,
              rgba(255, 120, 70, 0.2),
              transparent 75%
            ),
            radial-gradient(
              180px 120px at 70% 86%,
              rgba(255, 140, 85, 0.18),
              transparent 80%
            ),
            radial-gradient(
              120px 120px at 64% 80%,
              rgba(255, 190, 120, 0.2),
              transparent 75%
            ),
            radial-gradient(
              90px 90px at 82% 70%,
              rgba(255, 150, 95, 0.18),
              transparent 80%
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
              rgba(0,0,0,0.55) 100%
            )
          `,
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.045,
          backgroundImage: `url("data:image/svg+xml;utf8,` +
            `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>` +
            `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/></filter>` +
            `<rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }}
      />

      {/* Paper fiber texture */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.08,
          backgroundImage: `url("data:image/svg+xml;utf8,` +
            `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>` +
            `<filter id='p'>` +
            `<feTurbulence type='turbulence' baseFrequency='0.35' numOctaves='2' seed='3'/>` +
            `<feColorMatrix type='saturate' values='0'/>` +
            `</filter>` +
            `<rect width='100%' height='100%' filter='url(%23p)'/>` +
            `</svg>")`,
        }}
      />
    </div>
  );
}
