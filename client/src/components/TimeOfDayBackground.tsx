export function TimeOfDayBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#1C1A18",
          backgroundImage: `
            url('/backgrounds/paper-soot.webp'),
            url('/backgrounds/firelight-field.webp')
          `,
          backgroundRepeat: "repeat, no-repeat",
          backgroundSize: "auto, cover",
          backgroundPosition: "center, bottom left",
        }}
      />
    </div>
  );
}
