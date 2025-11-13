/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gray: {
          50: "#EEF0F3",
          100: "#DEE1E7",
          200: "#DEE1E7",
          300: "#B1B7C3",
          400: "#B1B7C3",
          500: "#717886",
          600: "#5B616E",
          700: "#32353D",
          800: "#32353D",
          900: "#0A0B0D",
          950: "#0A0B0D",
        },
        blue: {
          400: "#0000FF",
          500: "#0000FF",
          600: "#0000FF",
        },
        sky: {
          500: "#3C8AFF",
          600: "#3C8AFF",
        },
        purple: {
          500: "#3C8AFF",
          600: "#3C8AFF",
        },
        yellow: {
          500: "#FFD12F",
          600: "#FFD12F",
        },
        orange: {
          500: "#FFD12F",
          600: "#FFD12F",
        },
        green: {
          500: "#66C800",
          600: "#66C800",
        },
        lime: {
          500: "#B6F569",
          600: "#B6F569",
        },
        red: {
          500: "#FC401F",
          600: "#FC401F",
        },
        pink: {
          500: "#FEA8CD",
          600: "#FEA8CD",
        },
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
        xl: "20px",
      },
      backgroundImage: {
        'circle-gradient': 'linear-gradient(180deg, hsl(var(--secondary)) 0%, hsl(var(--secondary)) 100%)',
      },
      boxShadow: {
        'circle-card': '0 4px 12px rgba(10, 11, 13, 0.08)',
        'circle-dropdown': '0 2px 8px rgba(10, 11, 13, 0.12)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 