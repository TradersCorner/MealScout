export function TimeOfDayBackground() {
  return (
    <>
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundColor: "#FAFAF8",
          backgroundImage: "url('/backgrounds/food-truck-day.jpg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(12px)",
          transform: "scale(1.03)",
        }}
      />
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.85)",
        }}
      />
    </>
  );
}
