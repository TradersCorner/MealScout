import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
export function BackHeader(_a) {
    var title = _a.title, fallbackHref = _a.fallbackHref, subtitle = _a.subtitle, Icon = _a.icon, rightActions = _a.rightActions, _b = _a.className, className = _b === void 0 ? "" : _b;
    var _c = useLocation(), setLocation = _c[1];
    var handleBackClick = function (e) {
        e.preventDefault();
        console.log('🔙 Back button clicked, navigating to:', fallbackHref);
        // For better reliability, always use SPA navigation for now
        // Browser history can be unreliable in some environments
        setLocation(fallbackHref);
    };
    return (<header className={"sticky top-0 z-50 bg-white border-b border-border px-4 py-4 ".concat(className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleBackClick} data-testid="button-back" className="h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5"/>
          </Button>
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="h-6 w-6 text-primary"/>}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
        </div>
        {rightActions && (<div className="flex items-center space-x-2">
            {rightActions}
          </div>)}
      </div>
    </header>);
}
