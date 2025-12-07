import * as React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "type" | "inputMode"> {
  /** Whether this is a decimal/currency input (shows decimal point) or integer-only */
  allowDecimal?: boolean;
}

/**
 * Optimized currency/numeric input for iOS/Android
 * Uses inputMode="decimal" for currency/rates, inputMode="numeric" for integers
 * pattern="[0-9]*" ensures number pad on older devices
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, allowDecimal = true, ...props }, ref) => {
    return (
      <input
        type="number"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern="[0-9]*"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
