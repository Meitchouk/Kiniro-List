import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Label for the form field
   */
  label?: string;
  /**
   * Required indicator
   * @default false
   */
  required?: boolean;
  /**
   * Helper text
   */
  helperText?: string;
  /**
   * Error message
   */
  errorText?: string;
  /**
   * Error state (derived from errorText if not provided)
   */
  error?: boolean;
  /**
   * HTML ID for the form control (for label association)
   */
  htmlFor?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      className,
      label,
      required,
      helperText,
      errorText,
      error,
      htmlFor,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const hasError = error || !!errorText;
    const fieldId = htmlFor || generatedId;
    const descriptionId = `${fieldId}-description`;
    const errorId = `${fieldId}-error`;

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(hasError && "text-destructive")}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        {children}
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
FormField.displayName = "FormField";

export interface FormSectionProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Section title
   */
  title?: string;
  /**
   * Section description
   */
  description?: string;
}

const FormSection = React.forwardRef<HTMLElement, FormSectionProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn("space-y-6", className)}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-medium leading-6">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        <div className="space-y-4">{children}</div>
      </section>
    );
  }
);
FormSection.displayName = "FormSection";

export interface ValidationMessageProps {
  message?: string;
  type?: "error" | "warning" | "success" | "info";
  className?: string;
}

function ValidationMessage({
  message,
  type = "error",
  className,
}: ValidationMessageProps) {
  if (!message) return null;

  const colorClasses = {
    error: "text-destructive",
    warning: "text-yellow-600 dark:text-yellow-500",
    success: "text-green-600 dark:text-green-500",
    info: "text-blue-600 dark:text-blue-500",
  };

  return (
    <p
      className={cn("text-sm", colorClasses[type], className)}
      role={type === "error" ? "alert" : undefined}
    >
      {message}
    </p>
  );
}

export { FormField, FormSection, ValidationMessage };
