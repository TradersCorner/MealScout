"use client";
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
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";
var ToggleGroupContext = React.createContext({
    size: "default",
    variant: "default",
});
var ToggleGroup = React.forwardRef(function (_a, ref) {
    var className = _a.className, variant = _a.variant, size = _a.size, children = _a.children, props = __rest(_a, ["className", "variant", "size", "children"]);
    return (<ToggleGroupPrimitive.Root ref={ref} className={cn("flex items-center justify-center gap-1", className)} {...props}>
    <ToggleGroupContext.Provider value={{ variant: variant, size: size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>);
});
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;
var ToggleGroupItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, variant = _a.variant, size = _a.size, props = __rest(_a, ["className", "children", "variant", "size"]);
    var context = React.useContext(ToggleGroupContext);
    return (<ToggleGroupPrimitive.Item ref={ref} className={cn(toggleVariants({
            variant: context.variant || variant,
            size: context.size || size,
        }), className)} {...props}>
      {children}
    </ToggleGroupPrimitive.Item>);
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;
export { ToggleGroup, ToggleGroupItem };
