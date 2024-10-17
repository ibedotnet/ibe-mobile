/**
 * @file testTranslations.js
 * @description Provides access to translation values for testing purposes.
 * Imports translations from locale files and exposes them for use in tests.
 */

// Dynamically load translations based on locale
const en = require("../../src/locales/en.json"); // Load English translations
const es = require("../../src/locales/es.json"); // Load Spanish translations

/**
 * Retrieves the translations for a specified locale.
 *
 * @param {string} locale - The locale code (e.g., 'en', 'es') for which translations are needed.
 * @returns {Object} - The translations object corresponding to the provided locale.
 */
const getTranslations = (locale) => {
  switch (locale) {
    case "en":
      return en; // Return English translations
    case "es":
      return es; // Return Spanish translations
    default:
      console.warn(`Locale '${locale}' not recognized. Defaulting to English.`);
      return en; // Default to English translations if locale is not recognized
  }
};

// Set the default locale here (change as needed for different testing scenarios)
const defaultLocale = "en";

// Export translations for testing
export const translations = getTranslations(defaultLocale);
