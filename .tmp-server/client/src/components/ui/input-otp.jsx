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
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";
import { cn } from "@/lib/utils";
var InputOTP = React.forwardRef(function (_a, ref) {
    var className = _a.className, containerClassName = _a.containerClassName, props = __rest(_a, ["className", "containerClassName"]);
    return (<OTPInput ref={ref} containerClassName={cn("flex items-center justify-center gap-2 has-[:disabled]:opacity-50", containerClassName)} className={cn("disabled:cursor-not-allowed", className)} {...props}/>);
});
InputOTP.displayName = "InputOTP";
var InputOTPGroup = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<div ref={ref} className={cn("flex items-center gap-2", className)} {...props}/>);
});
InputOTPGroup.displayName = "InputOTPGroup";
var InputOTPSlot = React.forwardRef(function (_a, ref) {
    var index = _a.index, className = _a.className, props = __rest(_a, ["index", "className"]);
    var inputOTPContext = React.useContext(OTPInputContext);
    var _b = inputOTPContext.slots[index], char = _b.char, hasFakeCaret = _b.hasFakeCaret, isActive = _b.isActive;
    return (<div ref={ref} className={cn("relative flex h-12 w-12 items-center justify-center rounded-lg border border-slate-300 bg-white/90 text-lg font-semibold text-slate-900 shadow-sm transition-all", isActive && "z-10 ring-2 ring-orange-400 ring-offset-2 ring-offset-orange-50", className)} {...props}>
      {char}
      {hasFakeCaret && (<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000"/>
        </div>)}
    </div>);
});
InputOTPSlot.displayName = "InputOTPSlot";
var InputOTPSeparator = React.forwardRef(function (_a, ref) {
    var props = __rest(_a, []);
    return (<div ref={ref} role="separator" {...props}>
    <Dot />
  </div>);
});
InputOTPSeparator.displayName = "InputOTPSeparator";
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
