import type { MutableRefObject } from "react";
import { ArrowLeft, MonitorSmartphone } from "lucide-react";
import {
  GhostButton,
  PageHeader,
  StatusBadge,
  sectionCardClass,
} from "../../../../components/ui-kit";
import {
  productTabs,
  type CreateProductTabId,
} from "../createProductModel";

type HeaderAndTabsNavProps = {
  t: (val: string, params?: Record<string, string | number>) => string;
  isFormLocked: boolean;
  requestNavigateAway: () => Promise<void>;
  activeTab: CreateProductTabId;
  setActiveTab: (tab: CreateProductTabId) => void;
  isCreateFormDirty: boolean;
  isUploading: boolean;
  uploadingCount: number;
  createTabHasError: Record<CreateProductTabId, boolean>;
  tabRefs: MutableRefObject<
    Record<CreateProductTabId, HTMLButtonElement | null>
  >;
  tabOrder: readonly CreateProductTabId[];
  showLivePreview: boolean;
  onToggleLivePreview: () => void;
};

export function HeaderAndTabsNav({
  t,
  isFormLocked,
  requestNavigateAway,
  activeTab,
  setActiveTab,
  isCreateFormDirty,
  isUploading,
  uploadingCount,
  createTabHasError,
  tabRefs,
  tabOrder,
  showLivePreview,
  onToggleLivePreview,
}: HeaderAndTabsNavProps) {
  return (
    <>
      {/* Header */}
      <div className="sr-only">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isFormLocked}
          onClick={() => void requestNavigateAway()}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Về sản phẩm")}
        </button>
        <h3 className="text-lg font-semibold text-slate-900 sm:text-right">
          {t("Tạo sản phẩm")}
        </h3>
      </div>

      <div className={sectionCardClass}>
        <PageHeader
          title={t("Tạo sản phẩm")}
          subtitle={t("Thiết lập thông tin cơ bản, mô tả, thông số và video trước khi xuất bản sản phẩm mới.")}
          actions={
            <GhostButton
              disabled={isFormLocked}
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => void requestNavigateAway()}
              type="button"
            >
              {t("Về sản phẩm")}
            </GhostButton>
          }
        />
        <div className="mt-4 flex justify-end">
          <GhostButton
            icon={<MonitorSmartphone className="h-4 w-4" />}
            onClick={onToggleLivePreview}
            type="button"
          >
            {showLivePreview ? t("Đóng xem trước") : t("Xem trước trực tiếp")}
          </GhostButton>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {t("Tab hiện tại")}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
              {t(productTabs.find((tab) => tab.id === activeTab)?.label ?? "Thông tin")}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {t("Trạng thái biểu mẫu")}
            </p>
            <div className="mt-1">
              <StatusBadge tone={isCreateFormDirty ? "warning" : "neutral"}>
                {isCreateFormDirty ? t("Chưa lưu") : t("Đã sẵn sàng")}
              </StatusBadge>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {t("Tải tài nguyên")}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
              {isUploading ? t("Đang tải {count} tệp", { count: uploadingCount }) : t("Không có tệp đang tải")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 sm:hidden">
        <label className="block text-sm text-slate-700" htmlFor="create-product-tab-select">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t("Các tab sản phẩm")}
          </span>
          <select
            id="create-product-tab-select"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900"
            onChange={(event) => setActiveTab(event.target.value as CreateProductTabId)}
            value={activeTab}
          >
            {productTabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {t(tab.label)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="mt-4 hidden gap-2 overflow-x-auto px-1 pb-1 sm:flex sm:flex-wrap"
        role="tablist"
        aria-label={t("Các tab sản phẩm")}
      >
        {[
          {
            id: "basic",
            label: "Thông tin",
            errorTitle: "Thiếu tên, SKU hoặc giá bán",
          },
          {
            id: "description",
            label: "Mô tả chi tiết",
            errorTitle: "Có lỗi ở ảnh mô tả",
          },
          {
            id: "specs",
            label: "Thông số",
            errorTitle: "Có lỗi ở thông số",
          },
          {
            id: "videos",
            label: "Video",
            errorTitle: "URL video không hợp lệ",
          },
        ].map((tab) => {
          const tabId = tab.id as CreateProductTabId;
          const isTabActive = activeTab === tabId;
          const tabHasError = createTabHasError[tabId];

          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tabId] = node;
              }}
              id={`product-tab-${tab.id}`}
              className={
                isTabActive
                  ? `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow ${tabHasError ? "ring-2 ring-rose-200 ring-offset-2 ring-offset-white" : ""}`
                  : `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${tabHasError ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-700"}`
              }
              role="tab"
              aria-selected={isTabActive}
              aria-controls={`product-tabpanel-${tab.id}`}
              tabIndex={isTabActive ? 0 : -1}
              title={tabHasError ? t(tab.errorTitle) : undefined}
              onKeyDown={(event) => {
                const currentIndex = tabOrder.indexOf(activeTab);
                let nextIndex = currentIndex;

                switch (event.key) {
                  case "ArrowRight":
                  case "ArrowDown":
                    nextIndex = (currentIndex + 1) % tabOrder.length;
                    break;
                  case "ArrowLeft":
                  case "ArrowUp":
                    nextIndex =
                      (currentIndex - 1 + tabOrder.length) %
                      tabOrder.length;
                    break;
                  case "Home":
                    nextIndex = 0;
                    break;
                  case "End":
                    nextIndex = tabOrder.length - 1;
                    break;
                  default:
                    return;
                }

                event.preventDefault();
                const nextTab = tabOrder[nextIndex];
                setActiveTab(nextTab);
                tabRefs.current[nextTab]?.focus();
              }}
              onClick={() => setActiveTab(tabId)}
            >
              <span>{t(tab.label)}</span>
              {tabHasError ? (
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-current"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {isCreateFormDirty ? (
        <div
          className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
          role="status"
        >
          {t("Bạn có thay đổi chưa lưu trong biểu mẫu tạo sản phẩm.")}
        </div>
      ) : null}
    </>
  );
}

export default HeaderAndTabsNav;
