import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container, Section, Typography } from "@/components/ds";
import { createPageMetadataFromKey } from "@/lib/seo";
import { createServerDateFormatter } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadataFromKey("privacy", { path: "/privacy" });
}

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("legal");
  const dateFormatter = await createServerDateFormatter();
  const lastUpdatedDate = dateFormatter.formatLongDate(new Date("2026-01-16"));

  const sections = [
    {
      titleKey: "privacy.informationWeCollect",
      contentKey: "privacy.informationWeCollectContent",
    },
    {
      titleKey: "privacy.howWeUseInformation",
      contentKey: "privacy.howWeUseInformationContent",
    },
    {
      titleKey: "privacy.dataStorage",
      contentKey: "privacy.dataStorageContent",
    },
    {
      titleKey: "privacy.thirdPartyServices",
      contentKey: "privacy.thirdPartyServicesContent",
    },
    {
      titleKey: "privacy.cookies",
      contentKey: "privacy.cookiesContent",
    },
    {
      titleKey: "privacy.yourRights",
      contentKey: "privacy.yourRightsContent",
    },
    {
      titleKey: "privacy.childrenPrivacy",
      contentKey: "privacy.childrenPrivacyContent",
    },
    {
      titleKey: "privacy.changes",
      contentKey: "privacy.changesContent",
    },
    {
      titleKey: "privacy.contact",
      contentKey: "privacy.contactContent",
    },
  ];

  return (
    <Section className="py-8 md:py-12">
      <Container maxWidth="4xl">
        <div className="mb-8">
          <Typography variant="h1" className="mb-2">
            {t("privacy.title")}
          </Typography>
          <Typography variant="body2" colorScheme="secondary">
            {t("privacy.lastUpdated", { date: lastUpdatedDate })}
          </Typography>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <Typography variant="body1" className="mb-8">
            {t("privacy.introduction")}
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
