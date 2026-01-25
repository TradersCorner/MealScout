export function TimeOfDayBackground() {
  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#1C1A18]" />
      <img
        src="/backgrounds/night-market-plate.webp"
        alt=""
        aria-hidden="true"
        className="fixed z-0 pointer-events-none"
        style={{
          left: "50%",
          bottom: "-18%",
          width: "1800px",
          transform: "translateX(-50%)",
          opacity: 0.95,
        }}
      />
    </>
  );
}
