// Design tokens for Study Matrai - neo-brutalist pastel
export const colors = {
  background: "#FFFDF7",
  surface: "#FFFFFF",
  textPrimary: "#0A0A0A",
  textSecondary: "#4A4A4A",
  border: "#000000",
  mint: "#C4F1DE",
  lavender: "#E2D5F8",
  peach: "#FFD1C1",
  sun: "#FFE885",
  blue: "#3B82F6",
  green: "#86EFAC",
  red: "#FCA5A5",
};

export const shadow = {
  // Hard neo-brutalist shadow translated to RN (only Android via elevation differs; iOS shows offset)
  hard: {
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  hardLg: {
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
};

export const radii = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
