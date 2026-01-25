export function TimeOfDayBackground() {
  return (
    <>
      {/* Base */}
      <div className="fixed inset-0 z-0 bg-[#1C1A18]" />

      {/* Firelight plate */}
      <div
        className="fixed z-0 pointer-events-none"
        style={{
          left: "-20%",
          bottom: "-30%",
          width: "1400px",
          height: "1400px",
          backgroundImage: "url('/backgrounds/firelight-field.webp')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          opacity: 0.85,
        }}
      />

      {/* Paper texture */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('/backgrounds/paper-soot.webp')",
          backgroundRepeat: "repeat",
          opacity: 0.08,
        }}
      />
    </>
  );
}
