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

export function resolveProductImage(imageUrl?: string | null) {
  return imageUrl && imageUrl.trim().length > 0 ? imageUrl : neutralProductFallback;
}
