import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const textFieldWrapperVariants = cva("space-y-2", {
  variants: {
    fullWidth: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    fullWidth: true,
  },
});

const textFieldVariants = cva(
  "flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 text-xs",
        md: "h-9 text-sm",
        lg: "h-10 text-base",
      },
      error: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      error: false,
    },
  }
);

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof textFieldVariants> {
  /**
   * The label for the input
   */
  label?: string;
  /**
   * Helper text displayed below the input
   */
  helperText?: string;
  /**
   * Error message displayed below the input
   */
  errorText?: string;
  /**
   * Whether the field takes full width
   * @default true
   */
  fullWidth?: boolean;
  /**
   * Left addon/icon
   */
  startAdornment?: React.ReactNode;
  /**
   * Right addon/icon
   */
  endAdornment?: React.ReactNode;
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      size,
      error,
      label,
      helperText,
      errorText,
      fullWidth = true,
      startAdornment,
      endAdornment,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hasError = error || !!errorText;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;

    return (
      <div className={cn(textFieldWrapperVariants({ fullWidth }))}>
        {label && (
          <Label htmlFor={inputId} className={cn(hasError && "text-destructive")}>
            {label}
          </Label>
        )}
        <div className="relative">
          {startAdornment && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {startAdornment}
            </div>
          )}
          <Input
            id={inputId}
            ref={ref}
            className={cn(
              textFieldVariants({ size, error: hasError }),
              startAdornment && "pl-10",
              endAdornment && "pr-10",
              className
            )}
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={
              hasError ? errorId : helperText ? descriptionId : undefined
            }
            {...props}
          />
          {endAdornment && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {endAdornment}
            </div>
          )}
        </div>
        {helperText && !hasError && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
        {hasError && errorText && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {errorText}
          </p>
        )}
      </div>
    );
  }
);
TextField.displayName = "TextField";

export { TextField, textFieldVariants };
