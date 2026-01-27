var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
var Pagination = function (_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<nav role="navigation" aria-label="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props}/>);
};
Pagination.displayName = "Pagination";
var PaginationContent = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props}/>);
});
PaginationContent.displayName = "PaginationContent";
var PaginationItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<li ref={ref} className={cn("", className)} {...props}/>);
});
PaginationItem.displayName = "PaginationItem";
var PaginationLink = function (_a) {
    var className = _a.className, isActive = _a.isActive, _b = _a.size, size = _b === void 0 ? "icon" : _b, props = __rest(_a, ["className", "isActive", "size"]);
    return (<a aria-current={isActive ? "page" : undefined} className={cn(buttonVariants({
            variant: isActive ? "outline" : "ghost",
            size: size,
        }), className)} {...props}/>);
};
PaginationLink.displayName = "PaginationLink";
var PaginationPrevious = function (_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<PaginationLink aria-label="Go to previous page" size="default" className={cn("gap-1 pl-2.5", className)} {...props}>
    <ChevronLeft className="h-4 w-4"/>
    <span>Previous</span>
  </PaginationLink>);
};
PaginationPrevious.displayName = "PaginationPrevious";
var PaginationNext = function (_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<PaginationLink aria-label="Go to next page" size="default" className={cn("gap-1 pr-2.5", className)} {...props}>
    <span>Next</span>
    <ChevronRight className="h-4 w-4"/>
  </PaginationLink>);
};
PaginationNext.displayName = "PaginationNext";
var PaginationEllipsis = function (_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
    <MoreHorizontal className="h-4 w-4"/>
    <span className="sr-only">More pages</span>
  </span>);
};
PaginationEllipsis.displayName = "PaginationEllipsis";
export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, };
