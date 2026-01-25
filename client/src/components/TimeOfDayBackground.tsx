export function TimeOfDayBackground() {
  return (
    <>
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundColor: "#1C1A18",
          backgroundImage: "url('/backgrounds/food-truck-night.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </>
  );
}
