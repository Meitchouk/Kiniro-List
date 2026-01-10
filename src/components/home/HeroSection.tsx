import { ActionButton } from "@/components/common";
import { Typography, Stack, Flex } from "@/components/ds";
import { Calendar, Clock, Search } from "lucide-react";

interface HeroSectionProps {
  appName: string;
  subtitle: string;
  browseCalendar: string;
  viewSchedule: string;
  searchAnime: string;
}

/**
 * Hero section for home page
 */
export function HeroSection({
  appName,
  subtitle,
  browseCalendar,
  viewSchedule,
  searchAnime,
}: HeroSectionProps) {
  return (
    <Stack
      as="section"
      align="center"
      justify="center"
      gap={6}
      className="py-12 text-center md:py-20"
    >
      <Typography variant="h1" className="text-4xl sm:text-5xl md:text-6xl">
        <span className="text-primary">{appName}</span>
      </Typography>
      <Typography variant="subtitle1" colorScheme="secondary" className="max-w-2xl sm:text-xl">
        {subtitle}
      </Typography>
      <Flex wrap="wrap" justify="center" gap={4}>
        <ActionButton variant="primary" href="/calendar/now" icon={Calendar}>
          {browseCalendar}
        </ActionButton>
        <ActionButton variant="outline" href="/schedule/weekly" icon={Clock}>
          {viewSchedule}
        </ActionButton>
        <ActionButton variant="secondary" href="/search" icon={Search}>
          {searchAnime}
        </ActionButton>
      </Flex>
    </Stack>
  );
}
