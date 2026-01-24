import { useEffect, useState } from "react";

type Factors = {
  morning: number;
  midday: number;
  evening: number;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getTimeFactor(): Factors {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;

  // Morning 6–10, Midday 10–15, Evening 15–22
  if (hour < 6) return { morning: 0, midday: 0, evening: 0.6 };
  if (hour < 10) return { morning: (hour - 6) / 4, midday: 0, evening: 0 };
  if (hour < 15)
    return { morning: 1 - (hour - 10) / 5, midday: (hour - 10) / 5, evening: 0 };
  if (hour < 22)
    return {
      morning: 0,
      midday: 1 - (hour - 15) / 7,
      evening: (hour - 15) / 7,
    };
  return { morning: 0, midday: 0, evening: 1 };
}

export function TimeOfDayBackground() {
  const [factors, setFactors] = useState<Factors>(() => getTimeFactor());

  useEffect(() => {
    const update = () => setFactors(getTimeFactor());
    const id = window.setInterval(update, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 -z-50 pointer-events-none">
      {/* Base */}
      <div className="absolute inset-0" style={{ background: "#0E0F12" }} />

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
              1000px 700px at 50% 0%,
              rgba(255, 120, 60, 0.35),
              rgba(14, 15, 18, 0.85) 70%
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
