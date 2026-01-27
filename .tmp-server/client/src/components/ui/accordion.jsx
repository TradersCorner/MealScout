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
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
var Accordion = AccordionPrimitive.Root;
var AccordionItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props}/>);
});
AccordionItem.displayName = "AccordionItem";
var AccordionTrigger = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (<AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger ref={ref} className={cn("flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180", className)} {...props}>
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200"/>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>);
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
var AccordionContent = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (<AccordionPrimitive.Content ref={ref} className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" {...props}>
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>);
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
