import { describe, expect, it } from "vitest";
import {
  isLikelyImageAttachment,
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

  it("builds normalized attachment metadata for rendering", () => {
    const normalized = normalizeSupportAttachment({
      url: "support/evidence/dealers/1/9d0e914f-proof.jpg",
      fileName: "support/evidence/dealers/1/9d0e914f-proof.jpg",
    });

    expect(normalized).toEqual({
      url: "support/evidence/dealers/1/9d0e914f-proof.jpg",
      resolvedUrl: expect.stringContaining(
        "/api/v1/upload/support/evidence/dealers/1/9d0e914f-proof.jpg",
      ),
      fileName: "9d0e914f-proof.jpg",
    });
  });
});
