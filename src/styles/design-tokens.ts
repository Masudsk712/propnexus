// ============================================================================
// Design System Tokens — Unified Property Management Platform
// Premium SaaS design tokens for consistent styling across all components.
// ============================================================================

// ── Typography Scale ───────────────────────────────────────────────────────
export const typography = {
  fontFamily: {
    sans: "var(--font-inter), Inter, system-ui, -apple-system, sans-serif",
    mono: "var(--font-mono), JetBrains Mono, Fira Code, monospace",
  },
  fontSize: {
    display:  { size: "3.5rem", lineHeight: "1.1", fontWeight: "800", letterSpacing: "-0.04em" },
    h1:       { size: "2.5rem", lineHeight: "1.2", fontWeight: "700", letterSpacing: "-0.03em" },
    h2:       { size: "2rem", lineHeight: "1.25", fontWeight: "700", letterSpacing: "-0.02em" },
    h3:       { size: "1.5rem", lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.01em" },
    h4:       { size: "1.25rem", lineHeight: "1.4", fontWeight: "600", letterSpacing: "0em" },
    bodyLg:   { size: "1.125rem", lineHeight: "1.6", fontWeight: "400" },
    body:     { size: "0.938rem", lineHeight: "1.6", fontWeight: "400" },
    bodySm:   { size: "0.813rem", lineHeight: "1.5", fontWeight: "400" },
    caption:  { size: "0.75rem", lineHeight: "1.4", fontWeight: "400" },
    overline: { size: "0.688rem", lineHeight: "1.3", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" },
  },
} as const;

// ── Spacing Scale (4px grid) ──────────────────────────────────────────────
export const spacing = {
  xs: "0.25rem",   // 4px
  sm: "0.5rem",    // 8px
  md: "1rem",      // 16px
  lg: "1.5rem",    // 24px
  xl: "2rem",      // 32px
  "2xl": "3rem",   // 48px
  "3xl": "4rem",   // 64px
  "4xl": "6rem",   // 96px
} as const;

// ── Border Radius ──────────────────────────────────────────────────────────
export const radius = {
  none: "0",
  xs: "0.25rem",   // 4px
  sm: "0.375rem",  // 6px
  md: "0.5rem",    // 8px
  lg: "0.75rem",   // 12px
  xl: "1rem",      // 16px
  "2xl": "1.25rem",// 20px
  "3xl": "1.5rem", // 24px
  full: "9999px",
} as const;

// ── Shadows (with dark mode variants) ─────────────────────────────────────
export const shadows = {
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.10), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  // Card lift shadows
  "card-hover": "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
  "card-hover-dark": "0 20px 40px -12px rgba(0, 0, 0, 0.50)",
  // Glow effects for dark mode
  "glow-primary": "0 0 20px rgba(99, 102, 241, 0.3)",
  "glow-success": "0 0 20px rgba(16, 185, 129, 0.3)",
  "glow-warning": "0 0 20px rgba(245, 158, 11, 0.3)",
  "glow-destructive": "0 0 20px rgba(239, 68, 68, 0.3)",
} as const;

// ── Semantic Color Palette ─────────────────────────────────────────────────
// These are the branded gradient definitions used across the app.
export const semanticColors = {
  // Primary brand palette
  primary: {
    light: "oklch(0.52 0.22 255)",
    dark: "oklch(0.60 0.18 265)",
    gradient: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.60 0.18 265))",
    gradientHover: "linear-gradient(135deg, oklch(0.47 0.24 248), oklch(0.57 0.20 263))",
    bgLight: "oklch(0.50 0.22 250 / 0.08)",
    bgDark: "oklch(0.60 0.18 265 / 0.12)",
  },
  // KPI card gradients
  kpi: {
    revenue: "linear-gradient(135deg, oklch(0.55 0.20 155), oklch(0.50 0.15 175))",
    occupancy: "linear-gradient(135deg, oklch(0.55 0.22 255), oklch(0.52 0.22 290))",
    maintenance: "linear-gradient(135deg, oklch(0.65 0.22 75), oklch(0.50 0.24 20))",
    bookings: "linear-gradient(135deg, oklch(0.52 0.22 290), oklch(0.55 0.22 255))",
    tenants: "linear-gradient(135deg, oklch(0.55 0.15 195), oklch(0.50 0.22 250))",
    payments: "linear-gradient(135deg, oklch(0.55 0.20 155), oklch(0.55 0.15 195))",
    noi: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.55 0.15 195))",
    delinquency: "linear-gradient(135deg, oklch(0.50 0.24 20), oklch(0.65 0.22 75))",
  },
  // Status semaphore colors
  status: {
    success: { bg: "oklch(0.55 0.20 155 / 0.10)", text: "oklch(0.50 0.18 155)", dot: "oklch(0.55 0.20 155)" },
    warning: { bg: "oklch(0.65 0.22 75 / 0.10)", text: "oklch(0.60 0.20 75)", dot: "oklch(0.65 0.22 75)" },
    destructive: { bg: "oklch(0.50 0.24 20 / 0.10)", text: "oklch(0.48 0.22 20)", dot: "oklch(0.50 0.24 20)" },
    info: { bg: "oklch(0.55 0.15 195 / 0.10)", text: "oklch(0.50 0.13 195)", dot: "oklch(0.55 0.15 195)" },
  },
  // Property type gradients
  propertyTypes: {
    apartment: "linear-gradient(135deg, oklch(0.50 0.22 250 / 0.15), oklch(0.60 0.18 265 / 0.08))",
    house: "linear-gradient(135deg, oklch(0.55 0.20 155 / 0.15), oklch(0.50 0.15 175 / 0.08))",
    condo: "linear-gradient(135deg, oklch(0.52 0.22 290 / 0.15), oklch(0.55 0.22 255 / 0.08))",
    commercial: "linear-gradient(135deg, oklch(0.65 0.22 75 / 0.15), oklch(0.50 0.24 20 / 0.08))",
    townhouse: "linear-gradient(135deg, oklch(0.50 0.24 20 / 0.15), oklch(0.65 0.22 75 / 0.08))",
  },
} as const;

// ── Icon Background Gradients (for KPI cards, stat icons) ─────────────────
export const iconGradients: Record<string, { gradient: string; iconColor: string }> = {
  revenue: {
    gradient: "linear-gradient(135deg, oklch(0.55 0.20 155 / 0.15), oklch(0.50 0.15 175 / 0.08))",
    iconColor: "oklch(0.50 0.18 155)",
  },
  occupancy: {
    gradient: "linear-gradient(135deg, oklch(0.52 0.22 255 / 0.15), oklch(0.55 0.22 290 / 0.08))",
    iconColor: "oklch(0.52 0.22 255)",
  },
  maintenance: {
    gradient: "linear-gradient(135deg, oklch(0.65 0.22 75 / 0.15), oklch(0.50 0.24 20 / 0.08))",
    iconColor: "oklch(0.60 0.20 75)",
  },
  bookings: {
    gradient: "linear-gradient(135deg, oklch(0.52 0.22 290 / 0.15), oklch(0.55 0.22 255 / 0.08))",
    iconColor: "oklch(0.55 0.22 290)",
  },
  tenants: {
    gradient: "linear-gradient(135deg, oklch(0.55 0.15 195 / 0.15), oklch(0.50 0.22 250 / 0.08))",
    iconColor: "oklch(0.50 0.13 195)",
  },
  properties: {
    gradient: "linear-gradient(135deg, oklch(0.50 0.22 250 / 0.15), oklch(0.60 0.18 265 / 0.08))",
    iconColor: "oklch(0.50 0.22 250)",
  },
  payments: {
    gradient: "linear-gradient(135deg, oklch(0.55 0.20 155 / 0.15), oklch(0.55 0.15 195 / 0.08))",
    iconColor: "oklch(0.55 0.20 155)",
  },
  default: {
    gradient: "linear-gradient(135deg, oklch(0.50 0.22 250 / 0.15), oklch(0.55 0.22 290 / 0.08))",
    iconColor: "oklch(0.52 0.22 255)",
  },
};

// ── Animation Presets ─────────────────────────────────────────────────────
export const animations = {
  // Framer Motion variants
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  staggerChildren: {
    animate: { transition: { staggerChildren: 0.06 } },
  },
  staggerItem: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  cardHover: {
    whileHover: {
      y: -4,
      scale: 1.01,
      transition: { duration: 0.2, ease: "easeOut" },
    },
  },
  // Transition presets
  spring: { type: "spring" as const, stiffness: 300, damping: 30 },
  smooth: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
} as const;

// ── Glassmorphism Presets ──────────────────────────────────────────────────
export const glass = {
  light: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
  dark: {
    background: "rgba(15, 15, 25, 0.7)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  card: {
    light: {
      background: "rgba(255, 255, 255, 0.5)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
    },
    dark: {
      background: "rgba(20, 20, 35, 0.5)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
    },
  },
} as const;

// ── Layout Tokens ──────────────────────────────────────────────────────────
export const layout = {
  // Sidebar
  sidebar: {
    expandedWidth: 280,       // px
    collapsedWidth: 72,       // px
    transitionDuration: 0.3,  // seconds
    transitionEase: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  // Navbar
  navbar: {
    height: 64,               // px (4rem / h-16)
    zIndex: 30,
  },
  // Content container
  content: {
    maxWidth: 1280,           // px — matches max-w-7xl
    paddingX: {
      mobile: 16,             // px (p-4)
      tablet: 24,             // px (p-6)
      desktop: 32,            // px (p-8)
    },
    paddingY: {
      mobile: 16,
      tablet: 24,
      desktop: 32,
    },
  },
  // Page header
  pageHeader: {
    height: 56,               // px minimum
    marginBottom: 24,         // px below header
  },
} as const;

// ── Z-Index Scale ──────────────────────────────────────────────────────────
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
} as const;

// ── Breakpoints (matching Tailwind defaults) ───────────────────────────────
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// ── Chart Color Palette ────────────────────────────────────────────────────
export const chartColors = {
  light: [
    "oklch(0.50 0.22 250)",   // Sapphire
    "oklch(0.55 0.22 290)",   // Amethyst
    "oklch(0.55 0.20 155)",   // Emerald
    "oklch(0.65 0.22 75)",    // Amber
    "oklch(0.50 0.24 20)",    // Ruby
    "oklch(0.55 0.15 195)",   // Teal
    "oklch(0.50 0.05 260)",   // Slate
    "oklch(0.55 0.22 255 / 0.6)",  // Sapphire muted
  ],
  dark: [
    "oklch(0.60 0.18 265)",   // Sapphire light
    "oklch(0.65 0.18 290)",   // Amethyst light
    "oklch(0.55 0.18 155)",   // Emerald
    "oklch(0.68 0.20 80)",    // Amber light
    "oklch(0.52 0.22 25)",    // Ruby light
    "oklch(0.55 0.13 195)",   // Teal
    "oklch(0.55 0.04 260)",   // Slate
    "oklch(0.60 0.18 265 / 0.6)",  // Sapphire light muted
  ],
} as const;