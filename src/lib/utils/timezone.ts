import { DateTime } from "luxon";

/**
 * Timezone information with offset and current time
 */
export interface TimezoneInfo {
  name: string;
  offset: string;
  offsetMinutes: number;
  currentTime: string;
  displayName: string;
}

/**
 * Get timezone information including offset and current time
 */
export function getTimezoneInfo(tz: string): TimezoneInfo {
  try {
    const now = DateTime.now().setZone(tz);
    const offsetMinutes = now.offset;
    const offsetHours = offsetMinutes / 60;

    // Format offset as GMT+X or GMT-X
    const offsetSign = offsetMinutes >= 0 ? "+" : "";
    const offsetFormatted =
      offsetHours % 1 === 0
        ? `GMT${offsetSign}${offsetHours}`
        : `GMT${offsetSign}${offsetHours.toFixed(1).replace(".5", ":30")}`;

    // Get current time in 24h format
    const currentTime = now.toFormat("HH:mm");

    // Format display name
    const cityName = tz.includes("/") ? tz.split("/").pop()!.replace(/_/g, " ") : tz;
    const displayName = `${cityName} (${offsetFormatted})`;

    return {
      name: tz,
      offset: offsetFormatted,
      offsetMinutes,
      currentTime,
      displayName,
    };
  } catch {
    return {
      name: tz,
      offset: "GMT+0",
      offsetMinutes: 0,
      currentTime: "--:--",
      displayName: tz,
    };
  }
}

/**
 * Get all IANA timezones using Intl API
 */
export function getAllTimezones(): string[] {
  try {
    const timezones = Intl.supportedValuesOf("timeZone") as string[];
    return ["UTC", ...timezones.filter((tz) => tz !== "UTC")];
  } catch {
    // Fallback for older browsers
    return [
      "UTC",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Anchorage",
      "America/Phoenix",
      "America/Mexico_City",
      "America/Bogota",
      "America/Lima",
      "America/Santiago",
      "America/Buenos_Aires",
      "America/Sao_Paulo",
      "America/Caracas",
      "America/Toronto",
      "America/Vancouver",
      "America/Edmonton",
      "America/Guatemala",
      "America/Costa_Rica",
      "America/Panama",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Madrid",
      "Europe/Rome",
      "Europe/Amsterdam",
      "Europe/Brussels",
      "Europe/Vienna",
      "Europe/Zurich",
      "Europe/Stockholm",
      "Europe/Oslo",
      "Europe/Copenhagen",
      "Europe/Helsinki",
      "Europe/Warsaw",
      "Europe/Prague",
      "Europe/Budapest",
      "Europe/Athens",
      "Europe/Moscow",
      "Europe/Istanbul",
      "Europe/Kiev",
      "Europe/Lisbon",
      "Asia/Tokyo",
      "Asia/Seoul",
      "Asia/Shanghai",
      "Asia/Hong_Kong",
      "Asia/Taipei",
      "Asia/Singapore",
      "Asia/Bangkok",
      "Asia/Jakarta",
      "Asia/Manila",
      "Asia/Kolkata",
      "Asia/Mumbai",
      "Asia/Dubai",
      "Asia/Riyadh",
      "Asia/Tehran",
      "Asia/Jerusalem",
      "Asia/Beirut",
      "Asia/Kuwait",
      "Asia/Karachi",
      "Australia/Sydney",
      "Australia/Melbourne",
      "Australia/Brisbane",
      "Australia/Perth",
      "Australia/Adelaide",
      "Australia/Darwin",
      "Pacific/Auckland",
      "Pacific/Fiji",
      "Pacific/Honolulu",
      "Pacific/Guam",
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Africa/Lagos",
      "Africa/Nairobi",
    ];
  }
}

/**
 * Group timezones by region for better UX
 */
export function groupTimezones(timezones: string[]): Record<string, TimezoneInfo[]> {
  const groups: Record<string, TimezoneInfo[]> = {};

  for (const tz of timezones) {
    const [region] = tz.split("/");
    const groupKey = region || "Other";
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(getTimezoneInfo(tz));
  }

  // Sort regions
  const sortedGroups: Record<string, TimezoneInfo[]> = {};
  const orderedRegions = [
    "UTC",
    "America",
    "Europe",
    "Asia",
    "Australia",
    "Pacific",
    "Africa",
    "Atlantic",
    "Indian",
    "Antarctica",
  ];

  for (const region of orderedRegions) {
    if (groups[region]) {
      // Sort by offset first, then by name
      sortedGroups[region] = groups[region].sort((a, b) => {
        if (a.offsetMinutes !== b.offsetMinutes) {
          return a.offsetMinutes - b.offsetMinutes;
        }
        return a.name.localeCompare(b.name);
      });
    }
  }

  // Add any remaining regions
  for (const region of Object.keys(groups).sort()) {
    if (!sortedGroups[region]) {
      sortedGroups[region] = groups[region].sort((a, b) => {
        if (a.offsetMinutes !== b.offsetMinutes) {
          return a.offsetMinutes - b.offsetMinutes;
        }
        return a.name.localeCompare(b.name);
      });
    }
  }

  return sortedGroups;
}

/**
 * Get the browser's detected timezone
 */
export function getBrowserTimezone(): string {
  try {
    return DateTime.local().zoneName || "UTC";
  } catch {
    return "UTC";
  }
}
