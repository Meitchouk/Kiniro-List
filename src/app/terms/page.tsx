import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container, Section, Typography } from "@/components/ds";
import { createPageMetadataFromKey } from "@/lib/seo";
import { createServerDateFormatter } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadataFromKey("terms", { path: "/terms" });
}

export default async function TermsOfServicePage() {
  const t = await getTranslations("legal");
  const dateFormatter = await createServerDateFormatter();
  const lastUpdatedDate = dateFormatter.formatLongDate(new Date("2026-01-16"));

  const sections = [
    {
      titleKey: "terms.acceptanceOfTerms",
      contentKey: "terms.acceptanceOfTermsContent",
    },
    {
      titleKey: "terms.descriptionOfService",
      contentKey: "terms.descriptionOfServiceContent",
    },
    {
      titleKey: "terms.userAccounts",
      contentKey: "terms.userAccountsContent",
    },
    {
      titleKey: "terms.acceptableUse",
      contentKey: "terms.acceptableUseContent",
    },
    {
      titleKey: "terms.intellectualProperty",
      contentKey: "terms.intellectualPropertyContent",
    },
    {
      titleKey: "terms.thirdPartyContent",
      contentKey: "terms.thirdPartyContentContent",
    },
    {
      titleKey: "terms.disclaimers",
      contentKey: "terms.disclaimersContent",
    },
    {
      titleKey: "terms.limitationOfLiability",
      contentKey: "terms.limitationOfLiabilityContent",
    },
    {
      titleKey: "terms.termination",
      contentKey: "terms.terminationContent",
    },
    {
      titleKey: "terms.changes",
      contentKey: "terms.changesContent",
    },
    {
      titleKey: "terms.contact",
      contentKey: "terms.contactContent",
    },
  ];

  return (
    <Section className="py-8 md:py-12">
      <Container maxWidth="4xl">
        <div className="mb-8">
          <Typography variant="h1" className="mb-2">
            {t("terms.title")}
          </Typography>
          <Typography variant="body2" colorScheme="secondary">
            {t("terms.lastUpdated", { date: lastUpdatedDate })}
          </Typography>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <Typography variant="body1" className="mb-8">
            {t("terms.introduction")}
          </Typography>

          {sections.map((section, index) => (
            <div key={index} className="mb-8">
              <Typography variant="h3" className="mb-3">
                {t(section.titleKey)}
              </Typography>
              <Typography variant="body1" colorScheme="secondary" className="whitespace-pre-line">
                {t(section.contentKey)}
              </Typography>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
