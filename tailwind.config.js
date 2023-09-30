/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui")
  ],
  daisyui: {
    themes: [{
      light: {
        ...require("daisyui/src/theming/themes")["[data-theme=light]"],
        primary: "#214850",
        ".bg-base-100": {
          background: "#214850",
        },
        ".bg-base-200": {
          background: "linear-gradient(0deg, rgba(33,72,80,1) 0%, rgba(36,106,100,1) 100%)"
        },
        ".btn-primary": {
          background: "#214850",
          "border-color": "#44b3a8",
        },
        ".border-primary": {
          "border-color": "#44b3a8",
        },
        ".card": {
          border: "2px solid #44b3a8",
          "label": {
            color: "#fff",
          },
          ".label-text": {
            color: "#fff",
          },
          ".label-text-alt": {
            color: "#fff",
          },
          ".label-text-alt.text-error": {
            color: "hsl(var(--er))",
          },
        },
        ".card-title": {          
          color: "#fff",
        },
        ".drawer-side": {
          color: "#fff",
        },
        ".navbar": {
          color: "#fff",
        },
      },
      dark: {
        ...require("daisyui/src/theming/themes")["[data-theme=dark]"],
        primary: "#214850",
        "base-content": "#fff",
        ".bg-base-100": {
          background: "#214850",
        },
        ".bg-base-200": {
          background: "linear-gradient(0deg, rgba(33,72,80,1) 0%, rgba(36,106,100,1) 100%)"
        },
        ".btn-primary": {
          background: "#214850",
          "border-color": "#44b3a8",
        },
        ".border-primary": {
          "border-color": "#44b3a8",
        },
        ".card": {
          border: "2px solid #44b3a8",
        },
      }
    }],
  },
}

