// The GitHub Pages build is static (no API routes), so the client skips server calls there.
export const HAS_API = process.env.NEXT_PUBLIC_STATIC !== "1";
