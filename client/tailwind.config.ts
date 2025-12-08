import type { Config } from "tailwindcss";
import { createThemes } from "tw-colors";
import colors from "tailwindcss/colors";

const baseColors = [
  "gray",
  "red",
  "yellow",
  "green",
  "blue",
  "indigo",
  "purple",
  "pink",
];

const shadeMapping = {
  "50": "900",
  "100": "800",
  "200": "700",
  "300": "600",
  "400": "500",
  "500": "400",
  "600": "300",
  "700": "200",
  "800": "100",
  "900": "50",
};

const generateThemeObject = (colors: any, mapping: any, invert = false) => {
  const theme: any = {};
  baseColors.forEach((color) => {
    theme[color] = {};
    Object.entries(mapping).forEach(([key, value]: any) => {
      const shadeKey = invert ? value : key;
      theme[color][key] = colors[color][shadeKey];
    });
  });
  return theme;
};

const lightTheme = generateThemeObject(colors, shadeMapping);
const darkTheme = generateThemeObject(colors, shadeMapping, true);

const themes = {
  light: {
    ...lightTheme,
    white: "#ffffff",
  },
  dark: {
    ...darkTheme,
    white: colors.gray["950"],
    black: colors.gray["50"],
  },
};

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(to bottom right, var(--tw-gradient-stops))",
        "gradient-card": "linear-gradient(135deg, var(--tw-gradient-stops))",
        // Global theme gradients from Sidebar
        "gradient-theme": "linear-gradient(to bottom, rgb(15 23 42), rgb(30 41 59), rgb(30 27 75))",
        "gradient-theme-horizontal": "linear-gradient(to right, rgb(6 182 212 / 0.2), rgb(37 99 235 / 0.2))",
        "gradient-theme-button": "linear-gradient(to right, rgb(6 182 212), rgb(37 99 235))",
        "gradient-theme-button-hover": "linear-gradient(to right, rgb(8 145 178), rgb(29 78 216))",
      },
      colors: {
        // Theme colors from Sidebar
        "theme-cyan": {
          DEFAULT: "rgb(6 182 212)",
          100: "rgb(207 250 254)",
          200: "rgb(165 243 252)",
          300: "rgb(103 232 249)",
          400: "rgb(34 211 238)",
          500: "rgb(6 182 212)",
          600: "rgb(8 145 178)",
          700: "rgb(14 116 144)",
        },
        "theme-blue": {
          DEFAULT: "rgb(37 99 235)",
          400: "rgb(96 165 250)",
          500: "rgb(59 130 246)",
          600: "rgb(37 99 235)",
          700: "rgb(29 78 216)",
        },
      },
    },
  },
  plugins: [createThemes(themes)],
};

export default config;
