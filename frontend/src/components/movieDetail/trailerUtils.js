export function getEmbeddedTrailerUrl(url) {
  if (!url) {
    return "";
  }

  const normalizedUrl = url.trim();

  if (!normalizedUrl) {
    return "";
  }

  const youtubeId = extractYouTubeId(normalizedUrl);

  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
  }

  const vimeoId = extractVimeoId(normalizedUrl);

  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
  }

  return "";
}

function extractYouTubeId(url) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return parsedUrl.pathname.replace("/", "");
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v") || "";
      }

      if (parsedUrl.pathname.startsWith("/embed/")) {
        return parsedUrl.pathname.split("/")[2] || "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

function extractVimeoId(url) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();

    if (host !== "vimeo.com" && host !== "player.vimeo.com") {
      return "";
    }

    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    return segments.at(-1) || "";
  } catch {
    return "";
  }
}
