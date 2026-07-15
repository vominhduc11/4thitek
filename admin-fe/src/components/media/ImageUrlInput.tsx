import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { MediaPickerModal } from "./MediaPickerModal";
import { GhostButton, FieldErrorMessage } from "../ui-kit";
import { X, Image as ImageIcon } from "lucide-react";
import { type BackendAdminMediaListItem, type BackendMediaCategory } from "../../lib/adminApi";

interface ImageUrlInputProps {
  value: string;
  onChange: (url: string, mediaItem?: BackendAdminMediaListItem) => void;
  disabled?: boolean;
  error?: string;
  recommend?: string;
  category?: BackendMediaCategory;
}

function ImagePreview({ url }: { url: string }) {
  const { t } = useLanguage();
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const trimmed = (url ?? "").trim();

  useEffect(() => {
    if (!trimmed) {
      setOk(false);
      return;
    }
    setLoading(true);
    const img = new Image();
    img.loading = "eager";
    img.onload = () => {
      setOk(true);
      setLoading(false);
    };
    img.onerror = () => {
      setOk(false);
      setLoading(false);
    };
    img.src = trimmed;
  }, [trimmed]);

  if (!trimmed) return null;

  if (loading) {
    return (
      <div className="mt-3 flex h-40 w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] text-xs text-[var(--muted)]">
        {t("Đang tải xem trước...")}
      </div>
    );
  }

  if (!ok) {
    return (
      <div className="mt-3 flex h-40 w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] text-xs text-[var(--destructive-text)]">
        {t("Không thể tải ảnh xem trước")}
      </div>
    );
  }

  return (
    <div className="group relative mt-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
      <img
        src={trimmed}
        alt={t("Xem trước")}
        className="h-40 w-full object-cover transition duration-300 group-hover:scale-102"
        loading="eager"
      />
    </div>
  );
}

export function ImageUrlInput({
  value,
  onChange,
  disabled = false,
  error,
  recommend,
  category,
}: ImageUrlInputProps) {
  const { t } = useLanguage();
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasImage = Boolean(value?.trim());

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <GhostButton
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={disabled}
          icon={<ImageIcon className="h-4 w-4" />}
          className="min-h-10 rounded-xl px-3 text-xs"
        >
          {hasImage ? t("Thay đổi ảnh") : t("Chọn từ thư viện")}
        </GhostButton>

        {hasImage && (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-soft)] text-[var(--destructive-text)] transition hover:brightness-95 disabled:opacity-50"
            aria-label={t("Xóa ảnh")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {recommend && (
        <p className="text-xs text-[var(--muted)]">{recommend}</p>
      )}

      {error ? <FieldErrorMessage>{error}</FieldErrorMessage> : null}

      <ImagePreview url={value} />

      {pickerOpen && (
        <MediaPickerModal
          isOpen={pickerOpen}
          category={category}
          onSelect={(url, media) => {
            onChange(url, media);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
