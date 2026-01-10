/**
 * Kiniro List Design System
 *
 * A comprehensive design system for building consistent, accessible,
 * and maintainable UI components.
 *
 * @example
 * // Import specific components
 * import { Typography, Button, TextField } from '@/components/ds';
 *
 * // Import tokens for programmatic access
 * import { colors, spacing } from '@/components/ds/foundations';
 */

// =============================================================================
// FOUNDATIONS
// =============================================================================
export * from "./foundations";

// =============================================================================
// ATOMS - Basic building blocks
// =============================================================================
export * from "./atoms";

// =============================================================================
// MOLECULES - Composed components
// =============================================================================
export * from "./molecules";

// =============================================================================
// ORGANISMS - Complex components
// =============================================================================
export * from "./organisms";

// =============================================================================
// RE-EXPORTS FROM UI (shadcn/ui base components)
// These are the primitive components that DS components are built upon
// =============================================================================

// Core
export { Button, buttonVariants } from "@/components/ui/button";
export type { ButtonProps } from "@/components/ui/button";

export { Badge, badgeVariants } from "@/components/ui/badge";
export type { BadgeProps } from "@/components/ui/badge";

export { Input } from "@/components/ui/input";

export { Label } from "@/components/ui/label";

export { Skeleton } from "@/components/ui/skeleton";

// Cards
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

// Forms
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "@/components/ui/select";

export { Switch } from "@/components/ui/switch";

// Overlays
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";

// Navigation
export { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Data display
export { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
export { Separator } from "@/components/ui/separator";

// Feedback
export { Toaster } from "@/components/ui/sonner";
