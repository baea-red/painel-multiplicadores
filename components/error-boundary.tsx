'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-6 text-center space-y-3">
          <p className="text-2xl">⚠️</p>
          <p className="font-semibold text-gray-700">Algo deu errado</p>
          <p className="text-sm text-muted-foreground">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="text-sm text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Lightweight inline error display (not a class component)
export function ApiErrorMessage({ error }: { error: Error | null }) {
  if (!error) return null
  return (
    <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
      {error.message}
    </div>
  )
}
