import { defineConfig } from 'vite';

// Config minimale : base relative pour que le build fonctionne
// même si le dossier dist est ouvert depuis un sous-chemin.
export default defineConfig({
  base: './',
});
