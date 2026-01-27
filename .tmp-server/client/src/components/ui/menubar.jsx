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
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
function MenubarMenu(_a) {
    var props = __rest(_a, []);
    return <MenubarPrimitive.Menu {...props}/>;
}
function MenubarGroup(_a) {
    var props = __rest(_a, []);
    return <MenubarPrimitive.Group {...props}/>;
}
function MenubarPortal(_a) {
    var props = __rest(_a, []);
    return <MenubarPrimitive.Portal {...props}/>;
}
function MenubarRadioGroup(_a) {
    var props = __rest(_a, []);
    return <MenubarPrimitive.RadioGroup {...props}/>;
}
function MenubarSub(_a) {
    var props = __rest(_a, []);
    return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props}/>;
}
var Menubar = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<MenubarPrimitive.Root ref={ref} className={cn("flex h-10 items-center space-x-1 rounded-md border bg-background p-1", className)} {...props}/>);
});
Menubar.displayName = MenubarPrimitive.Root.displayName;
var MenubarTrigger = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<MenubarPrimitive.Trigger ref={ref} className={cn("flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground", className)} {...props}/>);
});
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;
var MenubarSubTrigger = React.forwardRef(function (_a, ref) {
    var className = _a.className, inset = _a.inset, children = _a.children, props = __rest(_a, ["className", "inset", "children"]);
    return (<MenubarPrimitive.SubTrigger ref={ref} className={cn("flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground", inset && "pl-8", className)} {...props}>
    {children}
    <ChevronRight className="ml-auto h-4 w-4"/>
  </MenubarPrimitive.SubTrigger>);
});
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;
var MenubarSubContent = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<MenubarPrimitive.SubContent ref={ref} className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]", className)} {...props}/>);
});
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;
var MenubarContent = React.forwardRef(function (_a, ref) {
    var className = _a.className, _b = _a.align, align = _b === void 0 ? "start" : _b, _c = _a.alignOffset, alignOffset = _c === void 0 ? -4 : _c, _d = _a.sideOffset, sideOffset = _d === void 0 ? 8 : _d, props = __rest(_a, ["className", "align", "alignOffset", "sideOffset"]);
    return (<MenubarPrimitive.Portal>
      <MenubarPrimitive.Content ref={ref} align={align} alignOffset={alignOffset} sideOffset={sideOffset} className={cn("z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]", className)} {...props}/>
    </MenubarPrimitive.Portal>);
});
MenubarContent.displayName = MenubarPrimitive.Content.displayName;
var MenubarItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, inset = _a.inset, props = __rest(_a, ["className", "inset"]);
    return (<MenubarPrimitive.Item ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", inset && "pl-8", className)} {...props}/>);
});
MenubarItem.displayName = MenubarPrimitive.Item.displayName;
var MenubarCheckboxItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, checked = _a.checked, props = __rest(_a, ["className", "children", "checked"]);
    return (<MenubarPrimitive.CheckboxItem ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} checked={checked} {...props}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4"/>
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>);
});
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;
var MenubarRadioItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (<MenubarPrimitive.RadioItem ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} {...props}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current"/>
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>);
});
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;
var MenubarLabel = React.forwardRef(function (_a, ref) {
    var className = _a.className, inset = _a.inset, props = __rest(_a, ["className", "inset"]);
    return (<MenubarPrimitive.Label ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)} {...props}/>);
});
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;
var MenubarSeparator = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<MenubarPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props}/>);
});
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;
var MenubarShortcut = function (_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props}/>);
};
MenubarShortcut.displayname = "MenubarShortcut";
export { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator, MenubarLabel, MenubarCheckboxItem, MenubarRadioGroup, MenubarRadioItem, MenubarPortal, MenubarSubContent, MenubarSubTrigger, MenubarGroup, MenubarSub, MenubarShortcut, };
