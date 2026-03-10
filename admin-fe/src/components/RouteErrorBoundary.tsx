import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
  message: string | null
}

class RouteErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: null,
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route render failed', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-800 shadow-sm">
          <p className="text-base font-semibold text-rose-900">Khong the hien thi trang nay</p>
          <p className="mt-2">
            {this.state.message || 'Da xay ra loi khi tai route. Thu lai de tiep tuc.'}
          </p>
          <button
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-700"
            onClick={this.handleRetry}
            type="button"
          >
            Thu lai
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default RouteErrorBoundary
