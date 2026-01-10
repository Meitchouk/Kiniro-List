import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface QuickLinkCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

/**
 * Quick link card for home page navigation
 */
export function QuickLinkCard({ href, icon: Icon, title, subtitle }: QuickLinkCardProps) {
  return (
    <Link href={href}>
      <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
        <CardContent className="flex items-center gap-4 p-6">
          <Icon className="h-8 w-8 text-primary" />
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
