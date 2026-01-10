"use client";

import { useTranslations } from "next-intl";
import { Typography, Container, Flex } from "@/components/ds";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t py-6 md:py-0">
      <Container>
        <Flex
          direction="column"
          align="center"
          justify="between"
          gap={4}
          className="md:h-16 md:flex-row"
        >
          <Typography
            variant="body2"
            colorScheme="secondary"
            align="center"
            className="md:text-left"
          >
            {t("common.appName")} © {new Date().getFullYear()}
          </Typography>
          <Typography variant="body2" colorScheme="secondary" align="center">
            {t("common.dataProvidedBy")}{" "}
            <a
              href="https://anilist.co"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary font-medium underline underline-offset-4"
            >
              AniList
            </a>
          </Typography>
        </Flex>
      </Container>
    </footer>
  );
}
