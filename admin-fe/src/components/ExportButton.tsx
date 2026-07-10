import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { GhostButton } from "./ui-kit";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";

type ExportButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "type"
> & {
  /** The export action. May be sync or async; rejections surface as a toast. */
  onExport: () => void | Promise<void>;
  label: string;
  icon?: ReactNode;
  /** Text shown while the export runs. Defaults to `${label}...`. */
  busyLabel?: string;
  /** Toast title used when the export fails. Defaults to `label`. */
  errorTitle?: string;
};

/**
 * Shared export/download control: a busy state, `aria-busy`, disables itself
 * while running, and surfaces failures as an error toast. Generalizes the
 * busy/aria-busy/error-toast pattern from ReportsPageRevamp and brings the
 * previously bare ProductsPage CSV export up to that standard. (ReportsPage
 * keeps its own control: its per-card XLSX/PDF pair + single-job queue exceed
 * this single-button shape.)
 */
export function ExportButton({
  onExport,
  label,
  icon,
  busyLabel,
  errorTitle,
  disabled,
  ...rest
}: ExportButtonProps) {
  const { notify } = useToast();
  const { t } = useLanguage();
  const [isBusy, setIsBusy] = useState(false);

  const handleClick = async () => {
    if (isBusy) {
      return;
    }
    setIsBusy(true);
    try {
      await onExport();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("Không xuất được dữ liệu"),
        { title: errorTitle ?? label, variant: "error" },
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <GhostButton
      type="button"
      icon={icon}
      onClick={() => void handleClick()}
      disabled={disabled || isBusy}
      aria-busy={isBusy || undefined}
      {...rest}
    >
      {isBusy ? (busyLabel ?? `${label}...`) : label}
    </GhostButton>
  );
}
