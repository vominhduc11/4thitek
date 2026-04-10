import { RefreshCw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ErrorState,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PrimaryButton,
  bodyTextClass,
  fieldHintClass,
  formCardClass,
  inputClass,
  labelClass,
  textareaClass,
} from "../components/ui-kit";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import {
  fetchAdminPublicContentSection,
  fetchAdminPublicContentSections,
  updateAdminPublicContentSection,
  type BackendPublicContentSectionResponse,
} from "../lib/adminApi";
import { translateCopy } from "../lib/i18n";

const copyKeys = {
  title: "Quản trị public content",
  description:
    "Quản lý các section public đang được main website đọc qua /api/v1/content/{section}. Chỉnh trực tiếp JSON payload và trạng thái publish cho từng locale.",
  reload: "Tải lại",
  save: "Lưu nội dung",
  saving: "Đang lưu...",
  section: "Section",
  locale: "Ngôn ngữ",
  published: "Đang publish",
  payload: "JSON payload",
  payloadHint:
    "Payload phải là JSON hợp lệ. Main site sẽ dùng bản đang publish làm nguồn dữ liệu chính.",
  summary: "Danh sách section hiện có",
  empty: "Chưa có section public content nào.",
  loadError: "Không tải được public content.",
  saveSuccess: "Đã lưu public content.",
  saveError: "Không lưu được public content.",
  invalidJson: "Payload phải là JSON object hoặc array hợp lệ.",
  lastUpdated: "Cập nhật lần cuối",
} as const;

const SECTION_PRIORITY = [
  "about",
  "contact",
  "policy",
  "certification",
  "become-reseller",
];

const localeOptions = ["vi", "en"] as const;

const sortSections = (sections: string[]) =>
  [...sections].sort((left, right) => {
    const leftIndex = SECTION_PRIORITY.indexOf(left);
    const rightIndex = SECTION_PRIORITY.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right);
    }
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }
    return leftIndex - rightIndex;
  });

export default function PublicContentPage() {
  const { accessToken } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const copy = translateCopy(copyKeys, t);

  const [sections, setSections] = useState<BackendPublicContentSectionResponse[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("about");
  const [selectedLocale, setSelectedLocale] = useState<(typeof localeOptions)[number]>("vi");
  const [payload, setPayload] = useState("");
  const [published, setPublished] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingSection, setIsLoadingSection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const availableSections = useMemo(() => {
    const uniqueSections = new Set(SECTION_PRIORITY);
    sections.forEach((entry) => uniqueSections.add(entry.section));
    return sortSections(Array.from(uniqueSections));
  }, [sections]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;
    setIsLoadingList(true);
    setError(null);

    void fetchAdminPublicContentSections(accessToken)
      .then((response) => {
        if (!active) {
          return;
        }
        setSections(response);
        if (response.length > 0) {
          const preferredSection =
            response.find((entry) => entry.section === selectedSection)?.section ??
            sortSections(Array.from(new Set(response.map((entry) => entry.section))))[0];
          if (preferredSection) {
            setSelectedSection(preferredSection);
          }
        }
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : copy.loadError);
      })
      .finally(() => {
        if (active) {
          setIsLoadingList(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, copy.loadError, selectedSection]);

  useEffect(() => {
    if (!accessToken || !selectedSection) {
      return;
    }

    let active = true;
    setIsLoadingSection(true);
    setError(null);

    void fetchAdminPublicContentSection(accessToken, selectedSection, selectedLocale)
      .then((response) => {
        if (!active) {
          return;
        }
        setPayload(response.payload);
        setPublished(response.published);
        setUpdatedAt(response.updatedAt ?? null);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setPayload("");
        setPublished(true);
        setUpdatedAt(null);
        setError(loadError instanceof Error ? loadError.message : copy.loadError);
      })
      .finally(() => {
        if (active) {
          setIsLoadingSection(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, copy.loadError, selectedLocale, selectedSection]);

  const handleReload = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoadingSection(true);
    setError(null);
    try {
      const response = await fetchAdminPublicContentSection(accessToken, selectedSection, selectedLocale);
      setPayload(response.payload);
      setPublished(response.published);
      setUpdatedAt(response.updatedAt ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.loadError);
    } finally {
      setIsLoadingSection(false);
    }
  };

  const handleSave = async () => {
    if (!accessToken) {
      return;
    }

    try {
      const parsed = JSON.parse(payload);
      if (!Array.isArray(parsed) && (parsed === null || typeof parsed !== "object")) {
        throw new Error(copy.invalidJson);
      }
    } catch (parseError) {
      showToast({
        title: copy.saveError,
        description:
          parseError instanceof Error && parseError.message
            ? parseError.message
            : copy.invalidJson,
        tone: "danger",
      });
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await updateAdminPublicContentSection(accessToken, selectedSection, {
        locale: selectedLocale,
        payload,
        published,
      });
      setPayload(response.payload);
      setPublished(response.published);
      setUpdatedAt(response.updatedAt ?? null);
      const nextSections = await fetchAdminPublicContentSections(accessToken);
      setSections(nextSections);
      showToast({
        title: copy.saveSuccess,
        tone: "success",
      });
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : copy.saveError;
      setError(message);
      showToast({
        title: copy.saveError,
        description: message,
        tone: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingList) {
    return (
      <PagePanel>
        <LoadingRows rows={5} />
      </PagePanel>
    );
  }

  if (error && sections.length === 0) {
    return (
      <PagePanel>
        <ErrorState
          title={copy.loadError}
          message={error}
          onRetry={() => window.location.reload()}
          retryLabel={copy.reload}
        />
      </PagePanel>
    );
  }

  return (
    <PagePanel>
      <PageHeader
        title={copy.title}
        subtitle={copy.description}
        actions={
          <>
            <GhostButton icon={<RefreshCw className="h-4 w-4" />} onClick={() => void handleReload()} type="button">
              {copy.reload}
            </GhostButton>
            <PrimaryButton
              disabled={isSaving || isLoadingSection}
              icon={<Save className="h-4 w-4" />}
              onClick={() => void handleSave()}
              type="button"
            >
              {isSaving ? copy.saving : copy.save}
            </PrimaryButton>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className={formCardClass}>
          <h2 className="text-base font-semibold text-[var(--ink)]">{copy.summary}</h2>
          <p className={`${bodyTextClass} mt-2`}>{copy.description}</p>
          <div className="mt-4 space-y-3">
            {availableSections.length === 0 ? (
              <p className={bodyTextClass}>{copy.empty}</p>
            ) : (
              availableSections.map((section) => {
                const sectionEntries = sections.filter((entry) => entry.section === section);
                const hasPublishedEntry = sectionEntries.some((entry) => entry.published);
                return (
                  <button
                    key={section}
                    type="button"
                    className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
                      selectedSection === section
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--accent)]"
                    }`}
                    onClick={() => setSelectedSection(section)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[var(--ink)]">{section}</span>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {hasPublishedEntry ? "published" : "draft"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {sectionEntries.length} locale
                      {sectionEntries.length === 1 ? "" : "s"}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className={formCardClass}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className={labelClass}>{copy.section}</span>
              <select
                className={inputClass}
                value={selectedSection}
                onChange={(event) => setSelectedSection(event.target.value)}
              >
                {availableSections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelClass}>{copy.locale}</span>
              <select
                className={inputClass}
                value={selectedLocale}
                onChange={(event) => setSelectedLocale(event.target.value as (typeof localeOptions)[number])}
              >
                {localeOptions.map((locale) => (
                  <option key={locale} value={locale}>
                    {locale}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 inline-flex items-center gap-3 text-sm font-medium text-[var(--ink)]">
            <input
              checked={published}
              className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
              onChange={(event) => setPublished(event.target.checked)}
              type="checkbox"
            />
            {copy.published}
          </label>

          <div className="mt-4 space-y-2">
            <span className={labelClass}>{copy.payload}</span>
            {isLoadingSection ? (
              <LoadingRows rows={6} />
            ) : (
              <textarea
                className={`${textareaClass} min-h-[520px] font-mono text-xs leading-6`}
                spellCheck={false}
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
              />
            )}
            <p className={fieldHintClass}>{copy.payloadHint}</p>
            {updatedAt ? (
              <p className={bodyTextClass}>
                {copy.lastUpdated}: {updatedAt}
              </p>
            ) : null}
            {error ? <p className="text-sm font-medium text-[var(--error-text)]">{error}</p> : null}
          </div>
        </section>
      </div>
    </PagePanel>
  );
}
