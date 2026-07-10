import { useRef, useEffect, useCallback, useState } from "react";
import { storeFileReference, deleteStoredFileReference } from "../../lib/upload";

export function useTrackedUpload(
  accessToken: string,
  notify: (msg: string, opt?: { title?: string; variant?: string }) => void,
  t: (val: string) => string,
) {
  const uploadedAssetUrlsRef = useRef<Set<string>>(new Set());
  const [uploadingCount, setUploadingCount] = useState(0);

  const isUploading = uploadingCount > 0;

  const uploadImageAsset = useCallback(
    async (file: File) => {
      setUploadingCount((current) => current + 1);
      try {
        const res = await storeFileReference({
          file,
          category: "products",
          accessToken,
        });
        if (res?.url) {
          uploadedAssetUrlsRef.current.add(res.url.trim());
        }
        return res;
      } finally {
        setUploadingCount((current) => Math.max(0, current - 1));
      }
    },
    [accessToken],
  );

  const getTrackedUploadUrls = useCallback((urls: Array<string | null | undefined>) =>
    Array.from(
      new Set(
        urls
          .map((url) => url?.trim() ?? "")
          .filter((url) => url && uploadedAssetUrlsRef.current.has(url)),
      ),
    ), []);

  const trackUploadedAsset = useCallback((url: string) => {
    const normalized = url.trim();
    if (normalized) uploadedAssetUrlsRef.current.add(normalized);
  }, []);

  const clearUploadedAssetTracking = useCallback(() => {
    uploadedAssetUrlsRef.current.clear();
  }, []);

  const cleanupUploadedAssets = useCallback(
    async (urls: Array<string | null | undefined>) => {
      const trackedUrls = getTrackedUploadUrls(urls);
      if (trackedUrls.length === 0) return;

      const results = await Promise.allSettled(
        trackedUrls.map(async (url) => {
          await deleteStoredFileReference({ url, accessToken });
          return url;
        }),
      );

      const failedUrls: string[] = [];
      results.forEach((result, index) => {
        const url = trackedUrls[index];
        if (result.status === "fulfilled") {
          uploadedAssetUrlsRef.current.delete(url);
          return;
        }
        failedUrls.push(url);
      });

      if (failedUrls.length > 0) {
        notify(
          t("Không thể dọn một số ảnh tạm trên máy chủ. Vui lòng thử lại."),
          {
            title: t("Sản phẩm"),
            variant: "error",
          },
        );
      }
    },
    [accessToken, getTrackedUploadUrls, notify, t],
  );

  useEffect(() => {
    const trackedUploads = uploadedAssetUrlsRef.current;
    return () => {
      if (trackedUploads.size > 0) {
        void Promise.allSettled(
          Array.from(trackedUploads).map(async (url) => {
            await deleteStoredFileReference({ url, accessToken });
          })
        );
      }
    };
  }, [accessToken]);

  return {
    isUploading,
    uploadImageAsset,
    trackUploadedAsset,
    clearUploadedAssetTracking,
    cleanupUploadedAssets,
    uploadedAssetUrlsRef,
    getTrackedUploadUrls,
  };
}
export default useTrackedUpload;
