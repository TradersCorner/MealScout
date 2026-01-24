export function TimeOfDayBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#1C1A18",
          backgroundImage: `
            url('/backgrounds/paper-grain.png'),
            url('/backgrounds/ember-specks.png'),
            radial-gradient(
              1100px circle at 20% 85%,
              rgba(255, 140, 70, 0.20),
              rgba(255, 140, 70, 0.10) 35%,
              rgba(255, 140, 70, 0.04) 55%,
              transparent 70%
            ),
            radial-gradient(
              900px circle at 80% 10%,
              rgba(0, 0, 0, 0.35),
              transparent 60%
            )
          `,
          backgroundRepeat: "repeat, repeat, no-repeat, no-repeat",
          backgroundSize: "512px 512px, 1024px 1024px, cover, cover",
          backgroundPosition: "top left, top left, center, center",
        }}
      />
    </div>
  );
}
