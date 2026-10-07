# CSRG Web — Frontend

Modern Single Page Application (SPA) for Cyber Security Research Group (CSRG) PENS built with React 19, Vite, Tailwind CSS, and Radix UI.

## Tech Stack
- **Framework**: React 19 + Vite 6
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS + Lucide Icons + Framer Motion
- **UI Components**: Radix UI (shadcn/ui style components)
- **Web Server (Production)**: Nginx Alpine (with custom security headers & reverse proxy)

## Scripts

### Development
```bash
npm install
npm run dev
```
Runs the Vite development server at `http://localhost:3000`.

### Production Build
```bash
npm run build
```
Generates production-optimized static assets in the `build/` directory with automatic `console.*` stripping.

### Preview Build
```bash
npm run preview
```
Previews the production build locally.

## Environment Variables

Copy `.env.example` to `.env` (already handled in Docker):
```env
VITE_BACKEND_URL=http://localhost:8000
```
