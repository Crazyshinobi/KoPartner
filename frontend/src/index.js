// SENTRY ERROR MONITORING - Must be first import
import "./instrument";
import { Sentry } from "./instrument";

import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "@/index.css";
import App from "@/App";

// Configure axios defaults for resilience
axios.defaults.timeout = 10000; // 10 second timeout (reduced for BASIC tier)

// Axios interceptor with Sentry error capture
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Capture API errors in Sentry
    if (error.response?.status >= 500 || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      Sentry.captureException(error, {
        tags: {
          type: 'api_error',
          endpoint: config?.url,
          method: config?.method,
        },
        extra: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          errorCode: error.code,
        }
      });
    }
    
    // Don't retry - let the error propagate to UI for user feedback
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary 
      fallback={<ErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('React Error:', error, errorInfo);
      }}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);

// Error fallback component
function ErrorFallback() {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '500px',
      margin: '100px auto'
    }}>
      <h2 style={{ color: '#9333EA', marginBottom: '16px' }}>Something went wrong</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        We're sorry, but something unexpected happened. Our team has been notified.
      </p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #9333EA, #EC4899)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Refresh Page
      </button>
    </div>
  );
}
