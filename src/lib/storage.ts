export const BUCKETS = {
  thumbnails: "project-thumbnails",
  videos: "project-videos",
  profile: "profile-images",
  assets: "website-assets",
  showreel: "showreel",
} as const;

export type BucketId = (typeof BUCKETS)[keyof typeof BUCKETS];

export const BUCKET_IDS: readonly BucketId[] = Object.values(BUCKETS);

export function isBucketId(v: string): v is BucketId {
  return (BUCKET_IDS as readonly string[]).includes(v);
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const ICON_TYPES = [...IMAGE_TYPES, "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"] as const;
