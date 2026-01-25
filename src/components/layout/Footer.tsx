"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mail, Heart, Calendar, Search, Github, MessageSquarePlus, ArrowRight } from "lucide-react";
import { Typography, Container, Flex, Grid, Divider, Card, CardContent } from "@/components/ds";
import { KofiWidget } from "@/components/common";

export function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { href: "/calendar/now", label: t("nav.calendarNow"), icon: Calendar },
    { href: "/calendar/upcoming", label: t("nav.calendarUpcoming"), icon: Calendar },
    { href: "/schedule/weekly", label: t("nav.schedule"), icon: Calendar },
    { href: "/search", label: t("nav.search"), icon: Search },
  ];

  const legalLinks = [
    { href: "/privacy", label: t("footer.privacy") },
    { href: "/terms", label: t("footer.terms") },
  ];

  const socialLinks = [
    {
      href: "https://github.com/Meitchouk/Kiniro-List",
      label: "GitHub",
      icon: Github,
      external: true,
    },
  ];

  return (
    <footer className="bg-muted/30 border-t">
      <Container>
        {/* Feedback Banner - Prominent CTA */}
        <div className="border-b py-6">
          <Link href="/feedback">
            <Card className="from-primary/10 via-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 group cursor-pointer bg-linear-to-r transition-all hover:shadow-md">
              <CardContent className="px-6 py-4">
                <Flex align="center" justify="between" gap={4}>
                  <Flex align="center" gap={4}>
                    <div className="bg-primary/20 rounded-full p-2.5">
                      <MessageSquarePlus className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <Typography variant="subtitle2" className="text-primary font-semibold">
                        {t("feedback.ctaTitle")}
                      </Typography>
                      <Typography variant="caption" colorScheme="secondary">
                        {t("feedback.ctaDescription")}
                      </Typography>
                    </div>
                  </Flex>
                  <Flex
                    align="center"
                    className="bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground rounded-full p-2 transition-all"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Flex>
                </Flex>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Footer Content */}
        <div className="py-10 md:py-12">
          <Grid cols={1} gap={8} className="md:grid-cols-2 lg:grid-cols-4">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link href="/" className="inline-block">
                <Typography variant="h3" className="text-primary mb-2">
                  {t("common.appName")}
                </Typography>
              </Link>
              <Typography variant="body2" colorScheme="secondary" className="mb-4 max-w-xs">
                {t("footer.tagline")}
              </Typography>
              <Typography variant="body2" colorScheme="secondary">
                {t("common.dataProvidedBy")}{" "}
                <a
                  href="https://anilist.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary font-medium underline underline-offset-4 transition-colors"
                >
                  AniList
                </a>
              </Typography>
            </div>

            {/* Navigation Links */}
            <div>
              <Typography variant="subtitle2" className="mb-4 font-semibold">
                {t("footer.navigation")}
              </Typography>
              <Flex direction="column" gap={2}>
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground hover:text-primary flex items-center gap-2 text-sm transition-colors"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </Flex>
            </div>

            {/* Legal Links */}
            <div>
              <Typography variant="subtitle2" className="mb-4 font-semibold">
                {t("footer.legal")}
              </Typography>
              <Flex direction="column" gap={2}>
                {legalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground hover:text-primary text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </Flex>
            </div>

            {/* Connect Section */}
            <div>
              <Typography variant="subtitle2" className="mb-4 font-semibold">
                {t("footer.connect")}
              </Typography>
              <Flex direction="column" gap={3}>
                {/* Contact Email */}
                <a
                  href="mailto:admin@kinirolist.app"
                  className="text-muted-foreground hover:text-primary flex items-center gap-2 text-sm transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  admin@kinirolist.app
                </a>

                {/* Social Links */}
                <Flex gap={3} className="mt-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                      className="text-muted-foreground hover:text-primary hover:bg-muted rounded-full p-2 transition-colors"
                    >
                      <link.icon className="h-5 w-5" />
                    </a>
                  ))}
                </Flex>
              </Flex>
            </div>

            {/* Support Section */}
            <div>
              <Typography variant="subtitle2" className="mb-4 font-semibold">
                {t("footer.support")}
              </Typography>
              <Typography variant="body2" colorScheme="secondary" className="mb-4">
                {t("footer.supportDescription")}
              </Typography>
              <KofiWidget variant="badge" badgeStyle="blue" />
            </div>
          </Grid>
        </div>

        <Divider />

        {/* Bottom Bar */}
        <div className="py-6">
          <Flex direction="column" align="center" justify="between" gap={4} className="md:flex-row">
            <Typography
              variant="body2"
              colorScheme="secondary"
              className="text-center md:text-left"
            >
              © {currentYear} {t("common.appName")}. {t("footer.allRightsReserved")}.
            </Typography>

            <Typography
              variant="body2"
              colorScheme="secondary"
              className="flex items-center gap-1 text-center"
            >
              {t("footer.madeWith")}{" "}
              <Heart className="text-destructive inline h-4 w-4 fill-current" />{" "}
              {t("footer.forAnimeFans")}
            </Typography>
          </Flex>
        </div>
      </Container>
    </footer>
  );
}
