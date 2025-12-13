# Easy-Cert Frontend

A secure document management system built with React, TypeScript, and Vite.

## Authors

* **Chotiwet Wisitworanut** - 65130500208
* **Witthawin Klairatsamee** - 65130500243
* **Thawatchai Wongboonsiri** - 65130500262
  
## Requirements

### Hardware Requirements
- **Processor**: 1 GHz or faster
- **RAM**: Minimum 4 GB (8 GB recommended)
- **Storage**: At least 500 MB of free disk space
- **Display**: 1024x768 minimum resolution

### Software Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+ or equivalent)
- **Bun**: v1.0.0 or higher (JavaScript runtime and package manager)
- **Node.js**: v18.0.0 or higher (required as Bun runtime dependency)
- **Git**: Latest version for version control

### Required Libraries & Dependencies

#### Core Dependencies
- **React**: ^19.0.0 - UI library
- **React DOM**: ^19.0.0 - React rendering
- **TypeScript**: ~5.7.2 - Type-safe JavaScript
- **Vite**: ^6.3.1 - Build tool and dev server

#### UI & Styling
- **Tailwind CSS**: ^4.1.4 - Utility-first CSS framework
- **@tailwindcss/vite**: ^4.1.4 - Tailwind Vite plugin
- **Radix UI**: ^1.2.0 - Accessible UI components
- **Lucide React**: ^0.503.0 - Icon library
- **React Icons**: ^5.5.0 - Additional icons

#### Routing & Navigation
- **React Router**: ^7.5.3 - Client-side routing
- **React Router DOM**: ^7.5.3 - DOM bindings for React Router

#### Utilities
- **Axios**: ^1.9.0 - HTTP client
- **Fabric.js**: ^6.7.1 - Canvas manipulation
- **@zxing/library**: ^0.21.3 - QR code/barcode scanning
- **clsx**: ^2.1.1 - Conditional className utility
- **tailwind-merge**: ^3.2.0 - Tailwind class merging

## Installation

### 1. Install Bun

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Verify installation:
```bash
bun --version
```

### 2. Clone the Repository

```bash
git clone https://github.com/Sunthewhat/Easy-Cert.git
cd Easy-Cert
```

### 3. Install Dependencies

```bash
bun install
```

This will install all required dependencies listed in [package.json](package.json).

### 4. Run Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000` 

### 5. Build for Production

```bash
bun run build
```

This compiles TypeScript and builds optimized production assets in the `dist/` directory.

### 6. Preview Production Build

```bash
bun run preview
```

## Available Scripts

- `bun run dev` - Start development server with hot module replacement
- `bun run build` - Build for production (TypeScript compilation + Vite build)
- `bun run lint` - Run ESLint to check code quality
- `bun run preview` - Preview production build locally

## Docker Deployment

For production deployment using Docker (as configured in VM-Mock):

```bash
# Build the Docker image
docker build -t easy-cert-frontend .

# Run the container
docker run -d -p 4000:4000 --name frontend easy-cert-frontend
```

The Dockerfile uses:
- **Builder stage**: `imbios/bun-node` - Builds the application
- **Runner stage**: `thistine/simple-http-server` - Serves static files
- **Port**: 4000 (exposed)

## Project Structure

```
Easy-Cert/
├── src/              # Source files
├── public/           # Static assets
├── dist/             # Production build output
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── vite.config.ts    # Vite configuration
└── README.md         # This file
```

## Troubleshooting

### Dependency Installation Issues
```bash
# Clear Bun cache and reinstall
rm -rf node_modules bun.lock
bun install
```

### Build Failures
Ensure TypeScript compilation passes:
```bash
bun x tsc --noEmit
```
