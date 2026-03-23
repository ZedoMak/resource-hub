const PROFILE_AVATAR_PRESETS = [
  { id: "violet", from: "#6366F1", to: "#8B5CF6" },
  { id: "sky", from: "#0EA5E9", to: "#2563EB" },
  { id: "emerald", from: "#10B981", to: "#059669" },
  { id: "amber", from: "#F59E0B", to: "#EA580C" },
  { id: "rose", from: "#F43F5E", to: "#EC4899" },
  { id: "slate", from: "#475569", to: "#0F172A" },
] as const;

export type ProfileAvatarPresetId = (typeof PROFILE_AVATAR_PRESETS)[number]["id"];

export function getProfileAvatarPresets() {
  return PROFILE_AVATAR_PRESETS;
}

export function getProfileInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "RH";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "RH";
}

export function createProfileAvatarDataUrl(name: string, presetId: ProfileAvatarPresetId): string {
  const preset = PROFILE_AVATAR_PRESETS.find((option) => option.id === presetId) ?? PROFILE_AVATAR_PRESETS[0];
  const initials = getProfileInitials(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${initials}">
      <defs>
        <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${preset.from}" />
          <stop offset="100%" stop-color="${preset.to}" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#avatarGradient)" />
      <circle cx="124" cy="36" r="20" fill="rgba(255,255,255,0.14)" />
      <circle cx="36" cy="124" r="28" fill="rgba(255,255,255,0.1)" />
      <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="700" fill="#ffffff">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

export function findMatchingProfileAvatarPreset(name: string, image: string | null | undefined): ProfileAvatarPresetId | null {
  if (!image) {
    return null;
  }

  for (const preset of PROFILE_AVATAR_PRESETS) {
    if (createProfileAvatarDataUrl(name, preset.id) === image) {
      return preset.id;
    }
  }

  return null;
}
