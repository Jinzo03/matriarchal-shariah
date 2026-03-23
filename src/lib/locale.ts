export type Locale = "en" | "ar";

export const LOCALE_COOKIE = "ms-locale";
export const DEFAULT_LOCALE: Locale = "en";

export const localeLabel: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

export const localeDir: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

export const ui = {
  en: {
    dashboard: "Dashboard",
    browse: "Browse",
    search: "Search",
    create: "Create",
    timeline: "Timeline",
    admin: "Admin",
    content: "Content",
    analytics: "Analytics",
    settings: "Settings",
    logs: "Logs",
    support: "Support",
    entities: "Entities",
    archived: "Archived",
    relationships: "Relationships",
    revisions: "Revisions",
    totalEntities: "Total Entities",
    archivedEntities: "Archived Entities",
    recentContent: "Recent Content",
    recentUpdates: "Recent Updates",
    recentRevisions: "Recent Revisions",
    recentEntityUpdates: "Recent Entity Updates",
    updatedThisWeek: "Updated This Week",
    backToAdminHub: "Back to Admin Hub",
    openBrowse: "Open browse",
    browseAll: "Browse all",
    openHistory: "Open history",
    importExport: "Import/Export",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    importUniverse: "Import Universe",
    exportBackupHelp: "Copy this JSON to keep a backup of the current universe.",
    importBackupHelp: "Paste a full export bundle here. This replaces the current data.",
    importPlaceholder: "Paste export JSON here",
    general: "General",
    maintenance: "Maintenance",
    enter: "Enter",
    openDashboard: "Open Dashboard",
    browseUniverse: "Browse Universe",
    language: "العربية",
  },
  ar: {
    dashboard: "لوحة التحكم",
    browse: "تصفح",
    search: "بحث",
    create: "إنشاء",
    timeline: "الخط الزمني",
    admin: "الإدارة",
    content: "المحتوى",
    analytics: "التحليلات",
    settings: "الإعدادات",
    logs: "السجلات",
    support: "الدعم",
    entities: "العناصر",
    archived: "المؤرشف",
    relationships: "العلاقات",
    revisions: "المراجعات",
    totalEntities: "إجمالي العناصر",
    archivedEntities: "العناصر المؤرشفة",
    recentContent: "المحتوى الحديث",
    recentUpdates: "التحديثات الأخيرة",
    recentRevisions: "المراجعات الأخيرة",
    recentEntityUpdates: "آخر تحديثات العناصر",
    updatedThisWeek: "تم تحديثه هذا الأسبوع",
    backToAdminHub: "العودة إلى لوحة الإدارة",
    openBrowse: "فتح التصفح",
    browseAll: "عرض الكل",
    openHistory: "فتح السجل",
    importExport: "استيراد/تصدير",
    exportJson: "تصدير JSON",
    importJson: "استيراد JSON",
    importUniverse: "استيراد الكون",
    exportBackupHelp: "انسخ هذا الملف للحفاظ على نسخة احتياطية من الكون الحالي.",
    importBackupHelp: "ألصق حزمة تصدير كاملة هنا. سيستبدل ذلك البيانات الحالية.",
    importPlaceholder: "ألصق JSON التصدير هنا",
    general: "عام",
    maintenance: "الصيانة",
    enter: "دخول",
    openDashboard: "افتح لوحة التحكم",
    browseUniverse: "تصفح الكون",
    language: "English",
  },
} as const;

export type UiKey = keyof typeof ui.en;

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ar";
}

export function t(locale: Locale, key: UiKey) {
  return ui[locale][key] ?? ui.en[key] ?? key.replace(/([A-Z])/g, " $1").trim();
}

export function formatLocaleDateTime(locale: Locale, value: Date) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
