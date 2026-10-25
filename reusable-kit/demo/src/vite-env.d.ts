/// <reference types="vite/client" />
declare module 'virtual:kit-registry' {
  type Asset = { status: string; category: string; path: string; source: string; dependencies: string[]; purpose?: string; use_when?: string; avoid_when?: string; demo_anchor?: string; recipe?: string; usage?: string };
  const assets: Record<string, Asset>;
  export default assets;
}
