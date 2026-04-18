import { describe, expect, it } from "vitest";
import {
  inferSupportAttachmentMediaType,
  isLikelyDocumentAttachment,
  isLikelyImageAttachment,
  isLikelyVideoAttachment,
  normalizeSupportAttachment,
  normalizeSupportAttachmentFileName,
  resolveSupportAttachmentUrl,
} from "./supportAttachment";

describe("isLikelyImageAttachment", () => {
  it("detects image by file extension", () => {
    expect(isLikelyImageAttachment({ fileName: "proof.JPEG" })).toBe(true);
  });

  it("detects image by url hint", () => {
    expect(
      isLikelyImageAttachment({
        url: "https://cdn.example.com/upload/123?content-type=image/png",
      }),
    ).toBe(true);
  });

  it("falls back to non-image for regular files", () => {
    expect(
      isLikelyImageAttachment({
        fileName: "reconciliation.xlsx",
        url: "https://cdn.example.com/files/reconciliation.xlsx",
      }),
    ).toBe(false);
  });

  it("detects video and document from type hints", () => {
    expect(
      isLikelyVideoAttachment({
        url: "https://cdn.example.com/files/evidence.mp4",
      }),
    ).toBe(true);
    expect(
      isLikelyDocumentAttachment({
        contentType: "application/pdf",
      }),
    ).toBe(true);
  });
});

describe("support attachment normalization", () => {
  it("normalizes private stored paths to the upload endpoint", () => {
    const resolved = resolveSupportAttachmentUrl(
      "support/evidence/dealers/1/9d0e914f-proof.jpg",
    );

    expect(resolved).toContain(
      "/api/v1/upload/support/evidence/dealers/1/9d0e914f-proof.jpg",
    );
  });

  it("rewrites legacy uploads-prefixed support paths to the authenticated upload endpoint", () => {
    const resolved = resolveSupportAttachmentUrl(
      "/uploads/support/evidence/dealers/1/9d0e914f-proof.jpg",
    );

    expect(resolved).toContain(
      "/api/v1/upload/support/evidence/dealers/1/9d0e914f-proof.jpg",
    );
  });

  it("keeps product assets on uploads path", () => {
    const resolved = resolveSupportAttachmentUrl("products/catalog/hero.png");

    expect(resolved).toContain("/uploads/products/catalog/hero.png");
  });

  it("sanitizes file names that were incorrectly stored as full paths", () => {
    expect(
      normalizeSupportAttachmentFileName(
        "support/evidence/dealers/1/9d0e914f-proof.jpg",
      ),
    ).toBe("9d0e914f-proof.jpg");
  });

  it("decodes percent-encoded file names for display", () => {
    expect(
      normalizeSupportAttachmentFileName("Ng%C6%B0%E1%BB%9Di%20d%C3%B9ng.pdf"),
    ).toBe("Người dùng.pdf");
  });

  it("builds normalized attachment metadata for rendering", () => {
    const normalized = normalizeSupportAttachment({
      url: "support/evidence/dealers/1/9d0e914f-proof.jpg",
      fileName: "support/evidence/dealers/1/9d0e914f-proof.jpg",
    });

    expect(normalized).toEqual({
      id: null,
      url: "support/evidence/dealers/1/9d0e914f-proof.jpg",
      resolvedUrl: expect.stringContaining(
        "/api/v1/upload/support/evidence/dealers/1/9d0e914f-proof.jpg",
      ),
      accessUrl: undefined,
      resolvedAccessUrl: undefined,
      fileName: "9d0e914f-proof.jpg",
      mediaType: "image",
      contentType: undefined,
      sizeBytes: undefined,
      createdAt: undefined,
    });
  });

  it("prefers explicit mediaType when provided", () => {
    expect(
      inferSupportAttachmentMediaType({
        fileName: "proof.jpg",
        mediaType: "video",
      }),
    ).toBe("video");
  });
});
