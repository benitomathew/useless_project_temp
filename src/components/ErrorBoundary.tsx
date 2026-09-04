import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Pazhaya Chollu Arcade Caught Error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF9E6] text-black flex flex-col items-center justify-center p-6 text-center font-['Fredoka',sans-serif]">
          <div className="max-w-md w-full bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
            <span className="text-6xl mb-4">💥</span>
            <h1 className="text-2xl font-black mb-2">Arcade Hit a Snag!</h1>
            <p className="text-gray-600 text-sm mb-6">
              A momentary hiccup occurred. Don&apos;t worry, your progress and records are safe.
            </p>
            <button
              id="error-reload-btn"
              onClick={this.handleReload}
              className="px-6 py-3 bg-[#FFD93D] hover:bg-[#ebc428] active:translate-y-1 text-black font-black text-lg border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Restart Arcade</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
