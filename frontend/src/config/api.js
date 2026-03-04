// Centralized API configuration
// Uses relative URL to leverage webpack dev server proxy in development
// The proxy is configured in craco.config.js to forward /api requests to backend

export const API_BASE = '/api';

export default API_BASE;
