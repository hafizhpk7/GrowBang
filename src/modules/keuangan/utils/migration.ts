export function decideGuestMigration(params: {
  signedIn: boolean;
  cloudHasData: boolean;
  localHasData: boolean;
}): "none" | "auto-upload" | "prompt" {
  const { signedIn, cloudHasData, localHasData } = params;

  if (!signedIn || !localHasData) {
    return "none";
  }

  if (localHasData && !cloudHasData) {
    return "auto-upload";
  }

  return "prompt";
}
