import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip";
var GOLD = {
    base: "#c58a1a", // warm, slightly desaturated gold
    light: "#e3c26a",
    dark: "#9c6a12",
};
export var GoldenForkIcon = function (_a) {
    var _b = _a.className, className = _b === void 0 ? "" : _b;
    return (<svg viewBox="0 0 64 64" role="img" aria-hidden="true" className={className} fill="none">
    <defs>
      <linearGradient id="goldenForkGradient" x1="0" y1="0" x2="0" y2="64">
        <stop offset="0%" stopColor={GOLD.light}/>
        <stop offset="55%" stopColor={GOLD.base}/>
        <stop offset="100%" stopColor={GOLD.dark}/>
      </linearGradient>
    </defs>
    {/* Subtle medallion glow behind the fork */}
    <circle cx="32" cy="32" r="20" fill={GOLD.light} fillOpacity={0.18}/>
    {/* Eating fork: three rounded tines and a tapered handle */}
    <g stroke="url(#goldenForkGradient)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      {/* Tines */}
      <path d="M24 10v10"/>
      <path d="M32 10v10"/>
      <path d="M40 10v10"/>
      {/* Bridge under tines */}
      <path d="M22 20h20"/>
      {/* Neck into handle */}
      <path d="M32 20v11"/>
      {/* Gently curved tapered handle */}
      <path d="M28 31c0 6 1 9 1 15 0 3 1.5 6 3 8 1.5-2 3-5 3-8 0-6 1-9 1-15"/>
    </g>
  </svg>);
};
export var GoldenPlateIcon = function (_a) {
    var _b = _a.className, className = _b === void 0 ? "" : _b;
    return (<svg viewBox="0 0 64 64" role="img" aria-hidden="true" className={className} fill="none">
    <circle cx="32" cy="32" r="26" fill={GOLD.dark}/>
    <circle cx="32" cy="32" r="22" fill={GOLD.base}/>
    <circle cx="32" cy="32" r="16" fill={GOLD.base} stroke={GOLD.light} strokeWidth={2}/>
  </svg>);
};
export function GoldenForkBadge(_a) {
    var _b = _a.size, size = _b === void 0 ? "md" : _b, _c = _a.showLabel, showLabel = _c === void 0 ? false : _c, influenceScore = _a.influenceScore;
    var sizeClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    };
    var badge = (<div className="inline-flex items-center gap-1 text-yellow-800">
      <GoldenForkIcon className={sizeClasses[size]}/>
      {showLabel && (<span className="text-sm font-semibold" style={{ color: GOLD.base }}>
          Golden Fork
        </span>)}
    </div>);
    return (<TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-bold" style={{ color: GOLD.base }}>
              Golden Fork Food Reviewer
            </p>
            <p className="text-xs text-gray-300">
              Awarded to influential food reviewers
            </p>
            {influenceScore !== undefined && (<p className="text-xs text-gray-300 mt-1">
                Influence Score: {influenceScore}
              </p>)}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>);
}
export function GoldenPlateBadge(_a) {
    var _b = _a.size, size = _b === void 0 ? "md" : _b, _c = _a.showLabel, showLabel = _c === void 0 ? false : _c, count = _a.count, year = _a.year;
    var sizeClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    };
    var badge = (<div className="inline-flex items-center gap-1 text-yellow-800">
      <GoldenPlateIcon className={sizeClasses[size]}/>
      {showLabel && (<span className="text-sm font-semibold" style={{ color: GOLD.dark }}>
          Golden Plate{count && count > 1 ? " x".concat(count) : ""}
        </span>)}
    </div>);
    return (<TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-bold" style={{ color: GOLD.dark }}>
              Golden Plate Winner
            </p>
            <p className="text-xs text-gray-300">
              Earned by restaurants through community consensus
            </p>
            {year && <p className="text-xs text-gray-300 mt-1">Year: {year}</p>}
            {count && count > 1 && (<p className="text-xs text-gray-300 mt-1">{count}x Champion</p>)}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>);
}
