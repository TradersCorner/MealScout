export function TimeOfDayBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* Base */}
      <div
        className="absolute inset-0"
        style={{
          background: "#1C1A18",
        }}
      />

      {/* Ember glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              1100px circle at 20% 85%,
              rgba(255, 140, 70, 0.22),
              rgba(255, 140, 70, 0.12) 35%,
              rgba(255, 140, 70, 0.05) 50%,
              transparent 65%
            )
          `,
        }}
      />

      {/* Quiet dark pocket */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              900px circle at 80% 10%,
              rgba(0,0,0,0.35),
              transparent 60%
            )
          `,
        }}
      />

      {/* Texture */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.35,
          backgroundImage: `url("/backgrounds/noise.png")`,
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
