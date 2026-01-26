/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Streamtape Video Extractor
 * Extracts direct video URLs from Streamtape embeds
 */

import type { VideoExtractor, ExtractionResult } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export const streamtapeExtractor: VideoExtractor = {
  name: "Streamtape",
  patterns: [
    /streamtape\.com\/e\//i,
    /streamtape\.com\/v\//i,
    /streamtape\.to\/e\//i,
    /streamtape\.to\/v\//i,
  ],

  async extract(embedUrl: string): Promise<ExtractionResult> {
    try {
      console.log(`[Streamtape] Extracting from: ${embedUrl}`);

      const response = await fetch(embedUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Referer: "https://streamtape.com/",
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          server: "Streamtape",
        };
      }

      const html = await response.text();

      // Method 1: Extract from robotlink div
      // The page has: <div id="robotlink">...</div> with a partial URL
      // And JavaScript that constructs the full URL
      const robotLinkMatch = html.match(/id=.robotlink.[^>]*>([^<]+)/);

      // Method 2: Extract the JavaScript construction pattern
      // innerHTML = '//streamtape.com/get_video?id=A'+ ('xyzaqxLp2QwZPcXAYD&expires=...')
      // The 'xyz' prefix needs to be removed from the second part
      const jsConstructMatch = html.match(
        /innerHTML\s*=\s*['"]([^'"]+)['"]\s*\+\s*\(['"]([^'"]+)['"]\)/
      );

      let videoUrl: string | null = null;

      if (jsConstructMatch) {
        // Combine the two parts, removing 'xyz' prefix from second part
        const part1 = jsConstructMatch[1];
        const part2 = jsConstructMatch[2].substring(3); // Remove 'xyz' prefix
        videoUrl = `https:${part1}${part2}`;
        console.log(`[Streamtape] Extracted via JS construct: ${videoUrl}`);
      } else if (robotLinkMatch) {
        // Fallback to robotlink
        const partialUrl = robotLinkMatch[1];
        if (partialUrl.startsWith("/")) {
          videoUrl = `https:/${partialUrl}`;
        } else if (partialUrl.startsWith("//")) {
          videoUrl = `https:${partialUrl}`;
        } else {
          videoUrl = partialUrl;
        }
        console.log(`[Streamtape] Extracted via robotlink: ${videoUrl}`);
      }

      if (!videoUrl) {
        return {
          success: false,
          error: "Could not find video URL in page",
          server: "Streamtape",
        };
      }

      // Log the original URL BEFORE any fixes to collect all mutations
      console.log(`[Streamtape] ORIGINAL URL (before fixes): ${videoUrl}`);

      // ============================================================
      // FIX STREAMTAPE ANTI-SCRAPING URL MUTATIONS
      // ============================================================
      // Streamtape injects random 'a' characters into URLs to break scrapers.
      // Based on 120 samples collected, the patterns are:
      //
      // DOMAIN VARIATIONS (12 found):
      //   stareamtape, straeamtape, streaamtape, streamatape,
      //   streamtaape, streamtapae, streamtapea + TLD variations
      //
      // TLD VARIATIONS:
      //   .acom, .caom, .coam, .coma (all insert 'a' somewhere)
      //
      // ENDPOINT VARIATIONS (11 found):
      //   aget_video, geat_video, gaet_video, geta_video,
      //   get_avideo, get_vaideo, get_viadeo, get_vidaeo,
      //   get_videao, get_videoa
      //
      // PARAM VARIATIONS (4 found):
      //   id, iad, aid, ida
      //
      // SOLUTION: Remove all 'a' characters from the URL path/domain
      // then reconstruct the correct URL
      // ============================================================

      // Step 1: Parse the URL to work with parts separately
      const urlMatch = videoUrl.match(/^(https?:)?\/\/([^/]+)\/([^?]+)\?(.+)$/);

      if (urlMatch) {
        const protocol = urlMatch[1] || "https:";
        let domain = urlMatch[2];
        let endpoint = urlMatch[3];
        let params = urlMatch[4];

        // Step 2: Fix domain - remove inserted 'a' characters
        // Pattern: str[e]a[m]tape or stream[t]a[p]e variations
        // The correct domain is "streamtape.com"
        domain = "streamtape.com";

        // Step 3: Fix endpoint - normalize to "get_video"
        // The pattern is always "get_video" with 'a' characters inserted at random positions:
        // - aget_video, geat_video, gaet_video, geta_video
        // - get_avideo, get_vaideo, get_viadeo, get_vidaeo, get_videao, get_videoa
        //
        // Strategy: Remove all 'a' characters and check if result is "get_video"
        const endpointWithoutA = endpoint.replace(/a/gi, "");
        if (endpointWithoutA === "get_video") {
          endpoint = "get_video";
        }

        // Step 4: Fix params - normalize "id" parameter
        // Variations: id, iad, aid, ida → all should be "id"
        params = params.replace(/^(i[ad]*|aid|ida)=/, "id=");

        // Reconstruct the URL
        videoUrl = `${protocol}//streamtape.com/${endpoint}?${params}`;
      } else {
        // Fallback: use regex replacements if parsing fails
        videoUrl = videoUrl
          // Fix any *tape*.com domain to streamtape.com
          .replace(/\/\/[a-z]*tape[a-z]*\.[a-z]+/gi, "//streamtape.com")
          // Fix endpoint
          .replace(/\/[a-z]*g[a-z]*et_[a-z]*v[a-z]*i[a-z]*d[a-z]*e[a-z]*o/gi, "/get_video")
          // Fix param
          .replace(/\?[ai]+d=/g, "?id=");
      }

      console.log(`[Streamtape] URL after fixes: ${videoUrl}`);

      // Streamtape's get_video endpoint returns a redirect to the actual video
      // We need to follow this redirect to get the final MP4 URL
      try {
        const videoResponse = await fetch(videoUrl, {
          method: "HEAD",
          headers: {
            "User-Agent": USER_AGENT,
            Referer: "https://streamtape.com/",
          },
          redirect: "follow",
        });

        // The final URL after redirects is the actual video URL
        const finalUrl = videoResponse.url;
        console.log(`[Streamtape] Final video URL after redirect: ${finalUrl}`);

        // Verify it's actually a video (not an error page)
        const contentType = videoResponse.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          console.error(`[Streamtape] Got HTML response instead of video. URL may be expired.`);
          return {
            success: false,
            error: "Video link expired or invalid",
            server: "Streamtape",
          };
        }

        // If the final URL is on a CDN (not streamtape.com), it doesn't need Referer
        // CDN URLs like tapecontent.net serve the video directly
        const isCdnUrl = !finalUrl.includes("streamtape.com");

        return {
          success: true,
          videos: [
            {
              url: finalUrl,
              quality: "auto",
              isM3U8: false,
              // Only include Referer for streamtape.com URLs, CDN URLs don't need it
              ...(isCdnUrl ? {} : { headers: { Referer: "https://streamtape.com/" } }),
            },
          ],
          server: "Streamtape",
        };
      } catch (redirectError) {
        console.error(`[Streamtape] Failed to follow redirect:`, redirectError);
        // Fall back to returning the original URL
        return {
          success: true,
          videos: [
            {
              url: videoUrl,
              quality: "auto",
              isM3U8: false,
              headers: {
                Referer: "https://streamtape.com/",
              },
            },
          ],
          server: "Streamtape",
        };
      }
    } catch (error) {
      console.error("[Streamtape] Extraction error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        server: "Streamtape",
      };
    }
  },
};
