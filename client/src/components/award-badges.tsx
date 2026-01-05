import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const GOLD = {
  base: '#c58a1a', // warm, slightly desaturated gold
  light: '#e3c26a',
  dark: '#9c6a12',
};

export const GoldenForkIcon = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    role="img"
    aria-hidden="true"
    className={className}
    fill="none"
    stroke={GOLD.base}
    strokeWidth={4}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Tines */}
    <path d="M18 8v14" />
    <path d="M28 8v14" />
    <path d="M36 8v14" />
    <path d="M46 8v14" />
    {/* Crown bar under tines */}
    <path d="M18 22h28" />
    {/* Neck and handle with subtle taper */}
    <path d="M32 22v14" />
    <path d="M32 36c0 6 -1 11 -1 20 0 3 2 6 2 6" />
  </svg>
);

export const GoldenPlateIcon = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    role="img"
    aria-hidden="true"
    className={className}
    fill="none"
  >
    <circle cx="32" cy="32" r="26" fill={GOLD.dark} />
    <circle cx="32" cy="32" r="22" fill={GOLD.base} />
    <circle cx="32" cy="32" r="16" fill={GOLD.base} stroke={GOLD.light} strokeWidth={2} />
  </svg>
);

interface GoldenForkBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  influenceScore?: number;
}

export function GoldenForkBadge({ size = 'md', showLabel = false, influenceScore }: GoldenForkBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const badge = (
    <div className="inline-flex items-center gap-1 text-yellow-800">
      <GoldenForkIcon className={sizeClasses[size]} />
      {showLabel && (
        <span className="text-sm font-semibold" style={{ color: GOLD.base }}>
          Golden Fork
        </span>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-bold" style={{ color: GOLD.base }}>Golden Fork Food Reviewer</p>
            <p className="text-xs text-gray-300">
              Awarded to influential food reviewers
            </p>
            {influenceScore !== undefined && (
              <p className="text-xs text-gray-300 mt-1">
                Influence Score: {influenceScore}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface GoldenPlateBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  count?: number;
  year?: string;
}

export function GoldenPlateBadge({ size = 'md', showLabel = false, count, year }: GoldenPlateBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const badge = (
    <div className="inline-flex items-center gap-1 text-yellow-800">
      <GoldenPlateIcon className={sizeClasses[size]} />
      {showLabel && (
        <span className="text-sm font-semibold" style={{ color: GOLD.dark }}>
          Golden Plate{count && count > 1 ? ` x${count}` : ''}
        </span>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-bold" style={{ color: GOLD.dark }}>Golden Plate Winner</p>
            <p className="text-xs text-gray-300">
              Earned by restaurants through community consensus
            </p>
            {year && <p className="text-xs text-gray-300 mt-1">Year: {year}</p>}
            {count && count > 1 && (
              <p className="text-xs text-gray-300 mt-1">
                {count}x Champion
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
