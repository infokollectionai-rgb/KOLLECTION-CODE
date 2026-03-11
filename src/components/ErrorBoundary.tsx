import { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import NeonButton from '@/components/ui/NeonButton';

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <span className="text-2xl">⚠</span>
            </div>
            <h1 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-6">An unexpected error occurred. Please try again.</p>
            <div className="flex justify-center gap-3">
              <NeonButton variant="solid" onClick={() => { this.setState({ hasError: false }); window.location.href = '/dashboard'; }}>
                Go to Dashboard
              </NeonButton>
              <NeonButton variant="outline" onClick={() => this.setState({ hasError: false })}>
                Try Again
              </NeonButton>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
