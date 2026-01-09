"use client";

import Link from "next/link";
import { LogIn, LogOut, User, Settings, Library, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "sonner";

export function UserMenu() {
  const t = useTranslations();
  const { user, signIn, logOut } = useAuth();

  const handleSignIn = async () => {
    try {
      await signIn();
      toast.success(t("common.login") + " successful!");
    } catch (error) {
      console.error("Sign in failed:", error);
      toast.error("Sign in failed. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      toast.success(t("common.logout") + " successful!");
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("Sign out failed. Please try again.");
    }
  };

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={handleSignIn}>
        <LogIn className="mr-2 h-4 w-4" />
        {t("common.login")}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
            <AvatarFallback>
              {user.displayName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.displayName && (
              <p className="font-medium">{user.displayName}</p>
            )}
            {user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/me/profile">
            <User className="mr-2 h-4 w-4" />
            {t("nav.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/me/library">
            <Library className="mr-2 h-4 w-4" />
            {t("nav.library")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/me/calendar">
            <Calendar className="mr-2 h-4 w-4" />
            {t("nav.myCalendar")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/me/settings">
            <Settings className="mr-2 h-4 w-4" />
            {t("nav.settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {t("common.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
