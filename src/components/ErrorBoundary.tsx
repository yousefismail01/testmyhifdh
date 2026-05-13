import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Without this a single throw anywhere in
 * the React tree blanks the whole page. The fallback shows the error
 * message and a button to reload, and the error is logged to the
 * console so it surfaces in browser devtools.
 *
 * Class component because error boundaries still require it as of
 * React 19 — there's no hook equivalent yet.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // Surface in devtools. A future Sentry/etc integration would hook
    // in here.
    console.error("App error caught by boundary:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 px-6"
        >
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Something went wrong
            </h1>
            <p className="text-sm">
              The app hit an unexpected error. Reloading usually fixes
              it. If it keeps happening, file an issue with the
              message below.
            </p>
            <pre className="text-xs text-start bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 overflow-auto max-h-40">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
