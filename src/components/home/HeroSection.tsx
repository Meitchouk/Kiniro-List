import { ActionButton } from "@/components/common";
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
        <section className="flex flex-col items-center justify-center gap-6 py-12 text-center md:py-20">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                <span className="text-primary">{appName}</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                {subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                <ActionButton 
                    variant="primary" 
                    href="/calendar/now" 
                    icon={Calendar}
                >
                    {browseCalendar}
                </ActionButton>
                <ActionButton 
                    variant="outline" 
                    href="/schedule/weekly" 
                    icon={Clock}
                >
                    {viewSchedule}
                </ActionButton>
                <ActionButton 
                    variant="secondary" 
                    href="/search" 
                    icon={Search}
                >
                    {searchAnime}
                </ActionButton>
            </div>
        </section>
    );
}
