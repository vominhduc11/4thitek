import { useEffect, useState } from "react";
import { fetchAdminReturnsPaged } from "../lib/adminApi";

export type NavBadgeCounts = Record<string, number>;

/**
 * Fetches the "needs attention" counts that are NOT already in
 * AdminDataContext. Currently just new (SUBMITTED) return requests, via a cheap
 * `size:1` count. Only queries when the caller says the user may see the module,
 * and any failure is swallowed so a broken/absent count simply shows no badge.
 *
 * Pending orders and pending users are derived in-layout from already-loaded
 * context data, so they are intentionally not fetched here. An "open support
 * tickets" badge is intentionally omitted: `/admin/support-tickets` has no
 * status-filtered count endpoint, so the only way to count open tickets is a
 * full client-side scan of every ticket — too costly for a per-mount badge.
 * Add it here once the backend exposes a cheap status count.
 *
 * NOTE: counts are fetched on mount (and when access changes); they refresh on
 * navigation-driven remounts / reload rather than live, which is acceptable for
 * an at-a-glance hint.
 */
export function useNavBadges({
  accessToken,
  canSeeReturns,
}: {
  accessToken: string | null;
  canSeeReturns: boolean;
}): NavBadgeCounts {
  const [badges, setBadges] = useState<NavBadgeCounts>({});

  useEffect(() => {
    if (!accessToken || !canSeeReturns) {
      setBadges({});
      return;
    }

    let cancelled = false;
    fetchAdminReturnsPaged(accessToken, { page: 0, size: 1, status: "SUBMITTED" })
      .then((response) => {
        if (!cancelled && response.totalElements > 0) {
          setBadges({ "/returns": response.totalElements });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [accessToken, canSeeReturns]);

  return badges;
}
