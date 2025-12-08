import { Award } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    <div className="inline-flex items-center gap-1">
      <Award className={`${sizeClasses[size]} text-yellow-600 fill-yellow-500`} />
      {showLabel && (
        <span className="text-sm font-semibold text-yellow-700">Golden Fork</span>
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
            <p className="font-bold">Golden Fork Food Reviewer</p>
            <p className="text-xs text-gray-300">
              Awarded to influential food reviewers
            </p>
            {influenceScore && (
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
}

export function GoldenPlateBadge({ size = 'md', showLabel = false, count }: GoldenPlateBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const badge = (
    <div className="inline-flex items-center gap-1">
      <Award className={`${sizeClasses[size]} text-amber-600 fill-amber-500`} />
      {showLabel && (
        <span className="text-sm font-semibold text-amber-700">
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
            <p className="font-bold">Golden Plate Winner</p>
            <p className="text-xs text-gray-300">
              Top-performing restaurant (awarded quarterly)
            </p>
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
