# LeaseOS Invoicing UI

This project is a React + Vite + Tailwind CSS frontend for LeaseOS dashboard modules (Invoicing, Collections, Rent Ledger, Dashboard).

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm (comes with Node.js)

Check installed versions:

```bash
node -v
npm -v
```

## 1) Install Dependencies

From project root (`leaseos-invoicing`), run:

```bash
npm install
```

This installs all dependencies from `package.json`, including:
- React
- Vite
- Tailwind CSS
- ESLint tooling

## 2) Run Development Server

```bash
npm run dev
```

After startup, Vite prints a local URL, usually:
- `http://localhost:5173/`
- or next free port (for example `http://localhost:5174/`) if 5173 is already in use.

## 3) Build for Production

```bash
npm run build
```

Output files are generated in the `dist` folder.

## 4) Preview Production Build

```bash
npm run preview
```

This serves the built app locally for final checks.

## 5) Run Lint

```bash
npm run lint
```

## Project Scripts

- `npm run dev` - Start Vite dev server with hot reload
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint checks

## Common Issues

- **Port already in use**
  - Vite automatically uses another port.
  - Check terminal output for the actual URL.

- **Dependencies not found**
  - Delete `node_modules` and `package-lock.json`, then reinstall:
    ```bash
    npm install
    ```

- **Styles not updating**
  - Hard refresh browser (`Ctrl + F5`) once.
