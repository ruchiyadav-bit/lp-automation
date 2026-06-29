// ============================================================================
//  Stock image fetcher for the desktop landing-page feature.
//
//  - If PEXELS_API_KEY is set, fetches a real stock photo from Pexels
//    (simplest free-tier integration: one key, one GET request).
//  - Otherwise falls back to a keyless source (Lorem Picsum) so the feature
//    works out of the box with no signup. The seed makes it deterministic
//    per keyword.
//
//  Uses the global fetch available in Node 18+.
// ============================================================================

async function fetchStockImage(keyword = "abstract") {
  const term = String(keyword || "abstract").trim() || "abstract";
  const q = encodeURIComponent(term);
  const key = process.env.PEXELS_API_KEY;

  if (key) {
    try {
      const r = await fetch(
        `https://api.pexels.com/v1/search?query=${q}&per_page=1&orientation=landscape`,
        { headers: { Authorization: key } }
      );
      if (r.ok) {
        const data = await r.json();
        const photo = data.photos && data.photos[0];
        if (photo && photo.src) {
          return photo.src.landscape || photo.src.large || photo.src.original;
        }
      }
    } catch (e) {
      // fall through to the keyless fallback
    }
  }

  // Keyless fallback — loremflickr returns a photo TAGGED with the keyword(s),
  // so the image actually matches the article niche (unlike random Picsum).
  // Multiple words become comma-separated tags.
  const tags = encodeURIComponent(term.replace(/\s+/g, ",").toLowerCase());
  return `https://loremflickr.com/1200/600/${tags}`;
}

module.exports = { fetchStockImage };
