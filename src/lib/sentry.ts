// Sentry Initialization Scaffold
// Note: You must replace 'YOUR_SENTRY_DSN' with your actual DSN from Sentry.io
// To install dependencies, run: npm install @sentry/react @sentry/browser

export const initSentry = async () => {
  const DSN = import.meta.env.VITE_SENTRY_DSN || "";

  if (!DSN || DSN === "YOUR_SENTRY_DSN") {
    console.log("[Sentry] DSN not configured. Error monitoring is disabled.");
    return;
  }

  try {
    // Dynamic import to avoid bloating the initial bundle if not configured
    const Sentry = await import("@sentry/react");

    Sentry.init({
      dsn: DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
    });

    console.log("[Sentry] Initialized successfully.");
  } catch (err) {
    console.error("[Sentry] Failed to initialize:", err);
  }
};
