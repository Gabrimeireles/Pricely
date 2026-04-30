export const neutralProductFallback =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">
      <rect width="640" height="480" fill="#E6F4F1"/>
      <rect x="84" y="72" width="472" height="336" rx="24" fill="#D2ECE5"/>
      <circle cx="212" cy="208" r="48" fill="#0F766E" opacity="0.18"/>
      <circle cx="428" cy="176" r="36" fill="#2563EB" opacity="0.16"/>
      <rect x="156" y="296" width="328" height="26" rx="13" fill="#0F766E" opacity="0.24"/>
      <rect x="196" y="338" width="248" height="18" rx="9" fill="#2563EB" opacity="0.20"/>
    </svg>`,
  );

export const landingHeroImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 720">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#E8F7F3"/>
          <stop offset="100%" stop-color="#EAF2FF"/>
        </linearGradient>
      </defs>
      <rect width="960" height="720" rx="48" fill="url(#bg)"/>
      <rect x="96" y="96" width="768" height="528" rx="40" fill="#FFFFFF" opacity="0.92"/>
      <rect x="148" y="156" width="300" height="46" rx="23" fill="#0F766E" opacity="0.18"/>
      <rect x="148" y="224" width="228" height="26" rx="13" fill="#2563EB" opacity="0.16"/>
      <rect x="148" y="282" width="660" height="240" rx="28" fill="#F3F8F6"/>
      <rect x="186" y="316" width="168" height="168" rx="24" fill="#D8F0EA"/>
      <rect x="390" y="316" width="168" height="168" rx="24" fill="#E0EDFF"/>
      <rect x="594" y="316" width="168" height="168" rx="24" fill="#E7F6D8"/>
      <circle cx="270" cy="402" r="42" fill="#0F766E" opacity="0.28"/>
      <circle cx="474" cy="402" r="42" fill="#2563EB" opacity="0.28"/>
      <circle cx="678" cy="402" r="42" fill="#84CC16" opacity="0.28"/>
      <rect x="186" y="552" width="260" height="24" rx="12" fill="#0F766E" opacity="0.18"/>
      <rect x="478" y="552" width="200" height="24" rx="12" fill="#2563EB" opacity="0.18"/>
      <rect x="720" y="552" width="88" height="24" rx="12" fill="#84CC16" opacity="0.22"/>
    </svg>`,
  );

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export function resolveProductImage(imageUrl?: string | null) {
  if (!imageUrl || imageUrl.trim().length === 0) {
    return neutralProductFallback;
  }

  if (imageUrl.startsWith('/')) {
    return `${apiBaseUrl}${imageUrl}`;
  }

  return imageUrl;
}
