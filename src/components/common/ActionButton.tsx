import Link from "next/link";
import { Button } from "@/components/ds";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type ActionButtonVariant = "primary" | "outline" | "secondary";
type ActionButtonSize = "default" | "sm" | "lg" | "icon";

interface ActionButtonProps {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  href: string;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function ActionButton({
  variant = "primary",
  size = "lg",
  href,
  icon: Icon,
  iconPosition = "left",
  children,
  className,
  fullWidth = false,
}: ActionButtonProps) {
  const variantMap: Record<ActionButtonVariant, "default" | "outline" | "secondary"> = {
    primary: "default",
    outline: "outline",
    secondary: "secondary",
  };

  const buttonVariant = variantMap[variant];

  return (
    <Button
      asChild
      variant={buttonVariant}
      size={size}
      className={fullWidth ? `w-full ${className || ""}` : className}
    >
      <Link href={href}>
        {Icon && iconPosition === "left" && <Icon className="mr-2 h-5 w-5" />}
        {children}
        {Icon && iconPosition === "right" && <Icon className="ml-2 h-5 w-5" />}
      </Link>
    </Button>
  );
}
