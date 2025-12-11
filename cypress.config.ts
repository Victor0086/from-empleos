import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    // Importante: Aumenta el timeout porque la redirección a Azure puede tardar
    defaultCommandTimeout: 10000, 
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});