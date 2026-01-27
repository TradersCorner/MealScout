import { useEffect, useState } from "react";
var DAY_START_HOUR = 6;
var NIGHT_START_HOUR = 16;
var getThemeMode = function () {
    var hour = new Date().getHours();
    return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? "day" : "night";
};
export function TimeOfDayBackground() {
    var _a = useState(function () {
        if (typeof window === "undefined")
            return "day";
        return getThemeMode();
    }), mode = _a[0], setMode = _a[1];
    useEffect(function () {
        var applyTheme = function () {
            var nextMode = getThemeMode();
            setMode(nextMode);
            var root = document.documentElement;
            root.classList.remove("theme-day", "theme-night");
            root.classList.add("theme-".concat(nextMode));
        };
        applyTheme();
        var interval = window.setInterval(applyTheme, 5 * 60 * 1000);
        return function () { return window.clearInterval(interval); };
    }, []);
    var isDay = mode === "day";
    return (<>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
            backgroundColor: isDay ? "#FAFAF8" : "#1C1A18",
            backgroundImage: isDay
                ? "url('/backgrounds/food-truck-day.jpg')"
                : "url('/backgrounds/food-truck-night.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: isDay ? "blur(12px)" : "none",
            transform: isDay ? "scale(1.03)" : "none",
        }}/>
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{
            backgroundColor: "transparent",
            backgroundImage: isDay
                ? "none"
                : "linear-gradient(180deg, rgba(8, 8, 8, 0.75) 0%, rgba(8, 8, 8, 0.55) 50%, rgba(8, 8, 8, 0.7) 100%)",
        }}/>
    </>);
}
