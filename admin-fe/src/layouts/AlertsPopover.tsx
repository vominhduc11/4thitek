import React from "react";
import { BadgeAlert, type LucideIcon } from "lucide-react";
import { ghostButtonClass } from "../components/ui-kit";

export type AlertItem = {
  id: string;
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
};

interface AlertsPopoverProps {
  alertsRef: React.RefObject<HTMLDivElement>;
  alertsTriggerRef: React.RefObject<HTMLButtonElement>;
  alertsPopoverId: string;
  isAlertsOpen: boolean;
  toggleAlerts: () => void;
  unreadAlerts: AlertItem[];
  alerts: AlertItem[];
  readAlertIds: Set<string>;
  markAllAlertIds: (ids: string[]) => void;
  markAlertRead: (id: string) => void;
  navigate: (to: string) => void;
  copy: {
    alerts: string;
    markAllRead: string;
    alertsEmpty: string;
  };
}

export const AlertsPopover = ({
  alertsRef,
  alertsTriggerRef,
  alertsPopoverId,
  isAlertsOpen,
  toggleAlerts,
  unreadAlerts,
  alerts,
  readAlertIds,
  markAllAlertIds,
  markAlertRead,
  navigate,
  copy,
}: AlertsPopoverProps) => {
  return (
    <div className="relative" ref={alertsRef}>
      <button
        ref={alertsTriggerRef}
        aria-controls={alertsPopoverId}
        aria-expanded={isAlertsOpen}
        aria-haspopup="dialog"
        className={ghostButtonClass}
        onClick={toggleAlerts}
        type="button"
      >
        <BadgeAlert className="h-4 w-4" />
        <span className="hidden sm:inline">{copy.alerts}</span>
        {unreadAlerts.length > 0 ? (
          <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--destructive)] px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {unreadAlerts.length}
          </span>
        ) : null}
      </button>

      {isAlertsOpen ? (
        <div
          id={alertsPopoverId}
          aria-label={copy.alerts}
          className="absolute right-0 z-40 mt-2 w-[min(92vw,360px)] rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_18px_38px_rgba(15,23,42,0.14)]"
          role="dialog"
          tabIndex={-1}
        >
          <div className="flex items-center justify-between gap-3 px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {copy.alerts}
            </p>
            {unreadAlerts.length > 0 ? (
              <button
                className="text-xs font-semibold text-[var(--accent)]"
                onClick={() => {
                  markAllAlertIds(alerts.map((alert) => alert.id));
                }}
                type="button"
              >
                {copy.markAllRead}
              </button>
            ) : null}
          </div>
          {alerts.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {alerts.map((alert) => {
                const Icon = alert.icon;
                const isUnread = !readAlertIds.has(alert.id);
                return (
                  <li key={alert.id}>
                    <button
                      className={[
                        "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition",
                        isUnread
                          ? "bg-[var(--surface-muted)] hover:bg-[var(--accent-soft)]/50"
                          : "hover:bg-[var(--surface-muted)]",
                      ].join(" ")}
                      onClick={() => {
                        markAlertRead(alert.id);
                        navigate(alert.to);
                      }}
                      type="button"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-[var(--ink)]">
                            {alert.title}
                          </span>
                          {isUnread ? (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--destructive)]" />
                          ) : null}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                          {alert.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-2 py-4 text-sm text-[var(--muted)]">
              {copy.alertsEmpty}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};
