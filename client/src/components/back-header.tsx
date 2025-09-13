import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface BackHeaderProps {
  title: string;
  fallbackHref: string;
  icon?: React.ComponentType<any>;
  rightActions?: React.ReactNode;
  className?: string;
}

export function BackHeader({ 
  title, 
  fallbackHref, 
  icon: Icon, 
  rightActions,
  className = ""
}: BackHeaderProps) {
  return (
    <header className={`sticky top-0 z-50 bg-white border-b border-border px-4 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href={fallbackHref}>
            <Button 
              variant="ghost" 
              size="sm"
              data-testid={`button-back-${title.toLowerCase().replace(/\s+/g, '-')}`}
              className="h-10 w-10 p-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="h-6 w-6 text-primary" />}
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
          </div>
        </div>
        {rightActions && (
          <div className="flex items-center space-x-2">
            {rightActions}
          </div>
        )}
      </div>
    </header>
  );
}