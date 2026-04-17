import {
  buildApiUrl,
  hasBackendApi,
} from "./backendApi";
import {
  normalizeSupportAttachmentFileName,
  resolveSupportAttachmentUrl,
} from "./supportAttachment";

export type UploadCategory =
  | "products"
  | "blogs"
  | "avatars"
  | "dealer-avatars"
  | "payment-proofs"
  | "support-tickets";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string | null;
};

type UploadResponse = {
  url: string;
  fileName?: string;
  storedPath?: string;
};

type DeleteUploadResponse = {
  status: string;
  path: string;
};

export type StoredAsset = {
  fileName: string;
  url: string;
  previewUrl: string;
  storedPath?: string;
  storage: "remote";
};

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });

const extractErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as ApiResponse<unknown>;
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // ignore invalid payload
  }
  return `Upload failed (${response.status})`;
};

export const storeFileReference = async ({
  file,
  category,
  accessToken,
}: {
  file: File;
  category: UploadCategory;
  accessToken?: string | null;
}): Promise<StoredAsset> => {
  if (!hasBackendApi() || !accessToken) {
    throw new Error("Upload service is not configured");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildApiUrl(`/upload/${category}`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const payload = (await response.json()) as ApiResponse<UploadResponse>;
  if (!payload.success || !payload.data?.url) {
    throw new Error(payload.error || "Upload failed");
  }

  const displayFileName =
    normalizeSupportAttachmentFileName(payload.data.fileName, payload.data.url) ??
    file.name;
  const storedPath = payload.data.storedPath?.trim();

  return {
    fileName: displayFileName,
    url: payload.data.url,
    previewUrl: resolveSupportAttachmentUrl(payload.data.url),
    ...(storedPath ? { storedPath } : {}),
    storage: "remote",
  };
};

export const deleteStoredFileReference = async ({
  url,
  accessToken,
}: {
  url: string;
  accessToken?: string | null;
}) => {
  if (!url.trim() || !hasBackendApi() || !accessToken) {
    return;
  }

  const endpoint = new URL(buildApiUrl("/upload"));
  endpoint.searchParams.set("url", url);

  const response = await fetch(endpoint.toString(), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const payload = (await response.json()) as ApiResponse<DeleteUploadResponse>;
  if (!payload.success) {
    throw new Error(payload.error || "Delete upload failed");
  }
};
