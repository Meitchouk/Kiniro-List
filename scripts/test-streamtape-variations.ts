/**
 * Script to test Streamtape URL variations
 * Run with: npx tsx scripts/test-streamtape-variations.ts
 */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Sample Streamtape embed URLs to test
const testUrls = [
  "https://streamtape.com/e/AqxLp2QwZPcXAYD",
  "https://streamtape.com/e/LXqw17grGAhRK7j",
  "https://streamtape.com/e/BJX30dkwWOuyzez",
  "https://streamtape.com/e/qdPGpDPqDdtzzk4",
];

function fixStreamtapeUrl(videoUrl: string): string {
  // Parse the URL to work with parts separately
  const urlMatch = videoUrl.match(/^(https?:)?\/\/([^/]+)\/([^?]+)\?(.+)$/);

  if (urlMatch) {
    const protocol = urlMatch[1] || "https:";
    let endpoint = urlMatch[3];
    let params = urlMatch[4];

    // Fix endpoint - normalize to "get_video"
    // The pattern is always "get_video" with 'a' characters inserted at random positions:
    // - aget_video, geat_video, gaet_video, geta_video
    // - get_avideo, get_vaideo, get_viadeo, get_vidaeo, get_videao, get_videoa
    //
    // Strategy: Remove all 'a' characters and check if result is "get_video"
    const endpointWithoutA = endpoint.replace(/a/gi, "");
    if (endpointWithoutA === "get_video") {
      endpoint = "get_video";
    }

    // Fix params - normalize "id" parameter
    // Variations: id, iad, aid, ida → all should be "id"
    params = params.replace(/^(i[ad]*|aid|ida)=/, "id=");

    // Reconstruct with correct domain
    return `${protocol}//streamtape.com/${endpoint}?${params}`;
  }

  // Fallback
  return videoUrl
    .replace(/\/\/[a-z]*tape[a-z]*\.[a-z]+/gi, "//streamtape.com")
    .replace(/\/[a-z]*g[a-z]*et_[a-z]*v[a-z]*i[a-z]*d[a-z]*e[a-z]*o/gi, "/get_video")
    .replace(/\?[ai]+d=/g, "?id=");
}

async function extractVariations(embedUrl: string): Promise<string | null> {
  try {
    const response = await fetch(embedUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: "https://streamtape.com/",
      },
    });

    if (!response.ok) {
      console.log(`  HTTP ${response.status} for ${embedUrl}`);
      return null;
    }

    const html = await response.text();

    // Method 1: Extract from robotlink div
    const robotLinkMatch = html.match(/id=.robotlink.[^>]*>([^<]+)/);

    // Method 2: Extract the JavaScript construction pattern
    const jsConstructMatch = html.match(
      /innerHTML\s*=\s*['"]([^'"]+)['"]\s*\+\s*\(['"]([^'"]+)['"]\)/
    );

    let videoUrl: string | null = null;

    if (jsConstructMatch) {
      const part1 = jsConstructMatch[1];
      const part2 = jsConstructMatch[2].substring(3);
      videoUrl = `https:${part1}${part2}`;
    } else if (robotLinkMatch) {
      const partialUrl = robotLinkMatch[1];
      if (partialUrl.startsWith("/")) {
        videoUrl = `https:/${partialUrl}`;
      } else if (partialUrl.startsWith("//")) {
        videoUrl = `https:${partialUrl}`;
      } else {
        videoUrl = partialUrl;
      }
    }

    return videoUrl;
  } catch (error) {
    console.log(`  Error: ${error}`);
    return null;
  }
}

async function main() {
  console.log("=== Streamtape URL Variation Collector & Fixer Test ===\n");

  const variations: Set<string> = new Set();
  const fixedUrls: Set<string> = new Set();
  const domainVariations: Set<string> = new Set();
  const endpointVariations: Set<string> = new Set();
  const paramVariations: Set<string> = new Set();

  // Run multiple iterations to collect variations
  const iterations = 30;
  console.log(`Running ${iterations} iterations to collect URL variations...\n`);

  for (let i = 0; i < iterations; i++) {
    for (const url of testUrls) {
      const extracted = await extractVariations(url);
      if (extracted) {
        variations.add(extracted);

        // Apply fix and collect fixed URLs
        const fixed = fixStreamtapeUrl(extracted);
        fixedUrls.add(fixed);

        // Extract domain variation
        const domainMatch = extracted.match(/\/\/([^/]+)\//);
        if (domainMatch) {
          domainVariations.add(domainMatch[1]);
        }

        // Extract endpoint variation
        const endpointMatch = extracted.match(/\.com\/([^?]+)/);
        if (!endpointMatch) {
          const altMatch = extracted.match(/\/\/[^/]+\/([^?]+)/);
          if (altMatch) endpointVariations.add(altMatch[1]);
        } else {
          endpointVariations.add(endpointMatch[1]);
        }

        // Extract param variation
        const paramMatch = extracted.match(/\?([^=]+)=/);
        if (paramMatch) {
          paramVariations.add(paramMatch[1]);
        }
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    if ((i + 1) % 5 === 0) {
      console.log(`  Completed ${i + 1}/${iterations} iterations...`);
    }
  }

  console.log("\n=== RESULTS ===\n");

  console.log("Domain Variations Found:");
  domainVariations.forEach((d) => console.log(`  - ${d}`));

  console.log("\nEndpoint Variations Found:");
  endpointVariations.forEach((e) => console.log(`  - ${e}`));

  console.log("\nParam Variations Found:");
  paramVariations.forEach((p) => console.log(`  - ${p}`));

  console.log("\n=== Full URL Samples ===");
  let count = 0;
  variations.forEach((v) => {
    if (count < 20) {
      console.log(`  ${v.substring(0, 100)}...`);
      count++;
    }
  });

  console.log(`\nTotal unique URLs collected: ${variations.size}`);

  console.log("\n=== FIXED URLs (should all be normalized) ===");
  fixedUrls.forEach((f) => {
    const isCorrect = f.includes("streamtape.com/get_video?id=");
    console.log(`  ${isCorrect ? "✅" : "❌"} ${f.substring(0, 80)}...`);
  });

  // Verify all fixed URLs are correct
  const allCorrect = Array.from(fixedUrls).every((f) => f.includes("streamtape.com/get_video?id="));
  console.log(
    `\n=== VERIFICATION: ${allCorrect ? "✅ ALL URLS CORRECTLY FIXED" : "❌ SOME URLS STILL BROKEN"} ===`
  );
}

main().catch(console.error);
