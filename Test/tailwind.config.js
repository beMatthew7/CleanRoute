import { defineConfig } from "tailwindcss";
import flowbitePlugin from "flowbite/plugin";

export default defineConfig({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/flowbite-react/**/*.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [flowbitePlugin],
});