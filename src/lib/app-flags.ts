function parseBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (!value) {
    return defaultValue;
  }

  switch (value.trim().toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    case "0":
    case "false":
    case "no":
    case "off":
      return false;
    default:
      return defaultValue;
  }
}

export const SHOW_ADMIN_UI = parseBooleanFlag(
  process.env.NEXT_PUBLIC_SHOW_ADMIN_UI ?? "false",
  process.env.NODE_ENV !== "production"
);

export const ENABLE_ADMIN_MUTATIONS = parseBooleanFlag(
  process.env.ENABLE_ADMIN_MUTATIONS ?? "false",
  process.env.NODE_ENV !== "production"
);
