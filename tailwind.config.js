/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        'wave-ellipse': {
          '0%, 100%': { transform: 'scaleX(1) scaleY(1) rotate(0deg)' },
          '20%': { transform: 'scaleX(1.2) scaleY(0.9) rotate(-2deg)' },
          '40%': { transform: 'scaleX(0.9) scaleY(1.1) rotate(2deg)' },
          '60%': { transform: 'scaleX(1.1) scaleY(0.95) rotate(-1deg)' },
          '80%': { transform: 'scaleX(0.95) scaleY(1.05) rotate(1deg)' },
        },
        'wave-horizontal': {
          '0%, 100%': { transform: 'translateX(0) scaleX(1) scaleY(1) rotate(0deg)' },
          '20%': { transform: 'translateX(40vw) scaleX(1.2) scaleY(0.9) rotate(-2deg)' },
          '40%': { transform: 'translateX(-20vw) scaleX(0.9) scaleY(1.1) rotate(2deg)' },
          '60%': { transform: 'translateX(30vw) scaleX(1.1) scaleY(0.95) rotate(-1deg)' },
          '80%': { transform: 'translateX(-10vw) scaleX(0.95) scaleY(1.05) rotate(1deg)' },
        },
        drift: {
          '100%': { transform: 'rotate(-360deg)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'wave-ellipse': 'wave-ellipse 8s ease-in-out infinite',
        'wave-ellipse-delay-2': 'wave-ellipse 8s ease-in-out infinite 2s',
        'wave-ellipse-delay-4': 'wave-ellipse 8s ease-in-out infinite 4s',
        'wave-horizontal': 'wave-horizontal 12s ease-in-out infinite',
        'wave-horizontal-delay-2': 'wave-horizontal 12s ease-in-out infinite 2s',
        'wave-horizontal-delay-4': 'wave-horizontal 12s ease-in-out infinite 4s',
        'drift-4': 'drift 4s linear infinite',
        'drift-8': 'drift 8s linear infinite',
        'drift-10': 'drift 10s linear infinite',
        'drift-11': 'drift 11s linear infinite',
        'drift-13': 'drift 13.5s linear infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 