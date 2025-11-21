"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for gracefully handling errors in 3D rendering
 * and other complex components that might fail at runtime.
 *
 * Usage:
 * <ErrorBoundary fallback={<div>Something went wrong</div>}>
 *   <ThreeDComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI (or nothing if not provided)
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

/**
 * Specialized error boundary for 3D rendering components
 * Fails silently to not disrupt the user experience
 */
export class ThreeDErrorBoundary extends Component<{ children: ReactNode }, State> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log but don't show error to user - 3D is enhancement only
    console.warn('3D rendering failed (gracefully degraded):', error.message);
    console.debug('Error details:', errorInfo);
  }

  render(): ReactNode {
    // Fail silently - 3D graphics are enhancement, not core functionality
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}
