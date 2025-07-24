// tailwind.config.ts
import type { Config } from "tailwindcss"
import plugin from "tailwindcss/plugin"

const brandVars = [
  // Arbitrum
  "arbitrum-primary",
  "arbitrum-primary-light",
  "arbitrum-primary-lighter",
  "arbitrum-primary-lightest",
  "arbitrum-primary-dark",
  "arbitrum-primary-darker",
  "arbitrum-primary-darkest",
  // Stylus
  "stylus-secondary",
  "stylus-secondary-light",
  "stylus-secondary-lighter",
  "stylus-secondary-lightest",
  "stylus-secondary-dark",
  "stylus-secondary-darker",
  "stylus-secondary-darkest",
]

export default <Config>{
  darkMode: ["class"],

  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./tailwind-test-classes.txt",
  ],

  theme: {
    extend: {
      /* ---------- Neutral palette driven by CSS variables ---------- */
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        /* ---------- Brand palettes in HEX ---------- */
        arbitrum: {
          primary: "#12aaff",
          "primary-dark": "#0e8fd8",
          "primary-darker": "#0d84cc",
          "primary-darkest": "#0a6ba8",
          "primary-light": "#2db5ff",
          "primary-lighter": "#3fc0ff",
          "primary-lightest": "#66d1ff",
        },
        stylus: {
          secondary: "#ac1c5e",
          "secondary-dark": "#972054",
          "secondary-darker": "#8e1e4f",
          "secondary-darkest": "#751941",
          "secondary-light": "#bf2968",
          "secondary-lighter": "#c73573",
          "secondary-lightest": "#dc5187",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },

  plugins: [
    require("tailwindcss-animate"),

    plugin(({ addUtilities, matchUtilities }) => {
      const util: Record<string, Record<string, string>> = {}

      brandVars.forEach((v) => {
        util[`.bg-${v}`] = { backgroundColor: `rgb(var(--${v}))` }
        util[`.text-${v}`] = { color: `rgb(var(--${v}))` }
        util[`.border-${v}`] = { borderColor: `rgb(var(--${v}))` }
      })
      addUtilities(util)

      const brandVals = Object.fromEntries(brandVars.map((v) => [v, `rgb(var(--${v}))`]))
      matchUtilities(
        {
          from: (value) => ({ "--tw-gradient-from": value, "--tw-gradient-stops": "var(--tw-gradient-from), var(--tw-gradient-to, rgb(255 255 255 / 0))" }),
          via: (value) => ({ "--tw-gradient-stops": `var(--tw-gradient-from), ${value}, var(--tw-gradient-to, rgb(255 255 255 / 0))` }),
          to: (value) => ({ "--tw-gradient-to": value }),
        },
        { values: brandVals },
      )
    }),
  ],
}
