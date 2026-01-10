"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ds";
import { ExternalLink, Globe2, Link as LinkIcon } from "lucide-react";

interface ExternalLinkItem {
  id: number;
  url: string;
  site: string;
  icon?: string | null;
  color?: string | null;
  language?: string | null;
  type?: string | null;
}

interface AnimeExternalLinksProps {
  links: ExternalLinkItem[];
  maxLinks?: number;
}

/**
 * External links card showing streaming/info sites
 */
export function AnimeExternalLinks({ links, maxLinks = 8 }: AnimeExternalLinksProps) {
  const t = useTranslations("anime");

  if (!links || links.length === 0) return null;

  const getLanguageLabel = (lang: string | null | undefined): string => {
    if (!lang) return "";
    const normalized = lang.substring(0, 2).toUpperCase();
    return t(`linkLanguage.${normalized}` as never) || lang;
  };

  const getTypeLabel = (type: string | null | undefined): string => {
    if (!type) return "";
    return t(`linkType.${type}` as never) || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("externalLinks")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {links.slice(0, maxLinks).map((link, index) => {
          const accent = link.color || undefined;

          return (
            <a
              key={`link-${link.id}-${index}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-md border border-border/60 bg-muted/40 px-3 py-2 transition hover:border-primary hover:bg-primary/5"
              style={accent ? { borderColor: accent + "66" } : undefined}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background/80 ring-1 ring-border/60">
                {link.icon ? (
                  <Image
                    src={link.icon}
                    alt={link.site}
                    className="h-5 w-5 object-contain"
                    width={20}
                    height={20}
                  />
                ) : link.site.toLowerCase().includes("official") ? (
                  <Globe2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-foreground">
                    {link.site}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {link.type && <span>{getTypeLabel(link.type)}</span>}
                    {link.language && <span>{getLanguageLabel(link.language)}</span>}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
              </div>
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}
