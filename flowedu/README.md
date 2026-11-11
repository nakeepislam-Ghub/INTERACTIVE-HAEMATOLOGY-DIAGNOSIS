# Egypt Flow Educational App

A self-contained simulator added to the Interactive Haematology Diagnosis book. Open `flowedu/index.html` (served at `/flowedu/` on GitHub Pages).

Modules: Gating Lab (back-gating, contour/zebra, histogram + MFI), Singlet gating (FSC-A vs FSC-H), Fluorescence compensation lab, Marker glossary, and 14 clinical cases with OSCE exam mode, Arabic/English explanations and a case builder.

## Rebuilding `index.html` from source

Source is `src/FlowEdu.tsx` (React + TypeScript). From a scratch folder:

```
cp src/FlowEdu.tsx App.tsx && cp src/main.tsx src/tailwind.config.js .
npm i react react-dom lucide-react esbuild tailwindcss@3
echo '@tailwind base; @tailwind components; @tailwind utilities;' > in.css
npx tailwindcss -i in.css -o out.css --minify
npx esbuild main.tsx --bundle --minify --platform=browser --format=iife --define:process.env.NODE_ENV='"production"' --outfile=out.js
```

Then inline `out.css` and `out.js` into a single `index.html` (a `<style>` and a `<script>` in the body, with `<div id="root"></div>`).
