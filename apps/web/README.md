# Web Frontend

Vue 3 + TypeScript + Vite shell for net*CIRCUIT Remote. The current workspace and Logic Analyzer views are explicit placeholders for later Three.js/Canvas implementation.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The frontend communicates only through application-level `/api` and `/ws` interfaces. Physical FPGA transport details are prohibited here.
