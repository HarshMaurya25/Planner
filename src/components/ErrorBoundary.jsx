import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-app-border max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h1 className="text-2xl font-black text-app-heading mb-2">Something went wrong</h1>
            <p className="text-sm text-app-muted mb-8">The application encountered an unexpected error. Don't worry, your data is safe.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-accent text-white rounded-xl font-bold shadow-lg shadow-accent/20 transition-all active:scale-95"
            >
              Refresh Page
            </button>
            <details className="mt-6 text-left">
              <summary className="text-[10px] font-black text-app-muted uppercase tracking-widest cursor-pointer hover:text-app-body transition-colors">Technical Details</summary>
              <pre className="mt-2 p-4 bg-app-bg rounded-xl text-[10px] font-mono text-app-body overflow-auto max-h-40 no-scrollbar border border-app-border">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
