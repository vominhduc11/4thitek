import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Shared paginated-list hook for admin-fe list pages.
 *
 * It abstracts the manual fetch loop repeated across the *PageRevamp pages
 * (WarrantiesPageRevamp, SerialsPageRevamp, …): call a paged endpoint, track
 * page / totals / loading / error, and expose a `refetch`. It intentionally does
 * NOT introduce react-query — the codebase fetches through hand-written
 * `fetchAdmin*` helpers and the goal is a like-for-like refactor.
 */

export type AdminListPage<Row> = {
  items: Row[];
  page: number;
  totalPages: number;
  totalElements: number;
};

export type AdminListStatus = "idle" | "loading" | "success" | "error";

export type AdminListPagination = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
};

export type UseAdminListOptions<Row> = {
  /** Fetches one page. Closes over the caller's access token / filters. */
  fetchPage: (params: { page: number; size: number }) => Promise<AdminListPage<Row>>;
  pageSize?: number;
  /** When false the hook stays idle (e.g. no access token yet). */
  enabled?: boolean;
  /** Message used when a thrown error is not an `Error` instance. */
  fallbackError?: string;
};

export type UseAdminListResult<Row> = {
  /** `loading` only on the first load (no data yet); background reloads use `isFetching`. */
  status: AdminListStatus;
  items: Row[];
  pagination: AdminListPagination;
  isFetching: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
};

export function useAdminList<Row>({
  fetchPage,
  pageSize = 25,
  enabled = true,
  fallbackError = "Không tải được dữ liệu.",
}: UseAdminListOptions<Row>): UseAdminListResult<Row> {
  const [items, setItems] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [status, setStatus] = useState<AdminListStatus>("idle");
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Keep the latest fetchPage / fallback without forcing the load effect to
  // re-run on every render (callers usually pass an inline closure).
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;
  const fallbackErrorRef = useRef(fallbackError);
  fallbackErrorRef.current = fallbackError;
  const hasDataRef = useRef(false);

  const load = useCallback(
    async (targetPage: number) => {
      if (!enabled) {
        return;
      }
      setIsFetching(true);
      setStatus((prev) => (hasDataRef.current ? prev : "loading"));
      setError(null);
      try {
        const response = await fetchPageRef.current({ page: targetPage, size: pageSize });
        setItems(response.items);
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalElements);
        hasDataRef.current = true;
        setStatus("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : fallbackErrorRef.current);
        setStatus("error");
      } finally {
        setIsFetching(false);
      }
    },
    [enabled, pageSize],
  );

  useEffect(() => {
    void load(page);
    // `reloadToken` bumps trigger an explicit refetch of the current page.
  }, [load, page, reloadToken]);

  const refetch = useCallback(async () => {
    setReloadToken((token) => token + 1);
  }, []);

  const pagination = useMemo<AdminListPagination>(
    () => ({ page, totalPages, totalItems, pageSize }),
    [page, totalPages, totalItems, pageSize],
  );

  return { status, items, pagination, isFetching, error, page, setPage, refetch };
}
