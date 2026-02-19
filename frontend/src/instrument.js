/**
 * SENTRY ERROR MONITORING - Initialize BEFORE all other imports
 * This file captures ALL errors including startup errors
 * 
 * Import this file FIRST in index.js
 */

import * as Sentry from "@sentry/react";

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || '';
const SENTRY_ENV = process.env.REACT_APP_SENTRY_ENVIRONMENT || 'production';

// Only initialize if DSN is properly configured
if (SENTRY_DSN && !SENTRY_DSN.includes('placeholder')) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENV,
    
    // Performance: Low sampling for BASIC tier
    tracesSampleRate: 0.1,  // 10% of transactions
    
    // Session Replay for debugging user issues
    replaysSessionSampleRate: 0.0,  // Don't record sessions
    replaysOnErrorSampleRate: 0.5,  // Record 50% of sessions with errors
    
    // Don't send PII
    sendDefaultPii: false,
    
    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove password fields from request data
      if (event.request && event.request.data) {
        const data = event.request.data;
        if (typeof data === 'object') {
          delete data.password;
          delete data.otp;
        }
      }
      return event;
    },
    
    // Ignore common browser errors
    ignoreErrors: [
      // Random plugins/extensions
      "top.GLOBALS",
      // Chrome extensions
      "chrome-extension://",
      "moz-extension://",
      // Network errors that aren't actionable
      "Network request failed",
      "Failed to fetch",
      "Load failed",
      // Cancelled requests
      "AbortError",
      "cancelled",
    ],
    
    // Only capture errors from our domain
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
      // Third-party scripts
      /graph\.facebook\.com/i,
      /connect\.facebook\.net/i,
      /googletagmanager\.com/i,
      /analytics\.google\.com/i,
    ],
  });
  
  console.log(`[SENTRY] Initialized for environment: ${SENTRY_ENV}`);
} else {
  console.log('[SENTRY] Not configured - errors will only be logged locally');
}

export { Sentry };
