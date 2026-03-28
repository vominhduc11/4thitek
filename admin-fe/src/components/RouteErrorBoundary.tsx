import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { ErrorState, PagePanel, tableMetaClass } from "./ui-kit";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string | null;
};

const copyKeys = {
  title: "Không thể hiển thị trang này",
  message: "Đã xảy ra lỗi khi tải nội dung của trang. Hãy thử lại để tiếp tục.",
  retry: "Thử lại",
  details: "Chi tiết kỹ thuật",
} as const;

type RouteErrorFallbackProps = {
  message: string | null;
  onRetry: () => void;
};

const RouteErrorFallback = ({ message, onRetry }: RouteErrorFallbackProps) => {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);

  return (
    <PagePanel>
      <ErrorState
        title={copy.title}
        message={copy.message}
        onRetry={onRetry}
        retryLabel={copy.retry}
      />
      {message ? (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {copy.details}
          </p>
          <p className={`${tableMetaClass} mt-2 break-words`}>{message}</p>
        </div>
      ) : null}
    </PagePanel>
  );
};

class RouteErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Route render failed", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <RouteErrorFallback
          message={this.state.message}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
