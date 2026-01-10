import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const textAreaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      error: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
      },
    },
    defaultVariants: {
      error: false,
      resize: "vertical",
    },
  }
);

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textAreaVariants> {
  /**
   * The label for the textarea
   */
  label?: string;
  /**
   * Helper text displayed below the textarea
   */
  helperText?: string;
  /**
   * Error message displayed below the textarea
   */
  errorText?: string;
  /**
   * Whether to show character count
   * @default false
   */
  showCount?: boolean;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      error,
      resize,
      label,
      helperText,
      errorText,
      showCount = false,
      maxLength,
      value,
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
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className="space-y-2 w-full">
        {label && (
          <Label htmlFor={inputId} className={cn(hasError && "text-destructive")}>
            {label}
          </Label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={cn(textAreaVariants({ error: hasError, resize }), className)}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={
            hasError ? errorId : helperText ? descriptionId : undefined
          }
          {...props}
        />
        <div className="flex justify-between">
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
          {showCount && maxLength && (
            <p className="text-sm text-muted-foreground ml-auto">
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
TextArea.displayName = "TextArea";

export { TextArea, textAreaVariants };
