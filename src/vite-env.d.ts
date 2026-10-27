/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Address of the comparison API when the page is hosted elsewhere, e.g. https://boq-api.example.com. */
  readonly VITE_API_URL?: string;
}
