import { describe, expect, it } from "vitest";
import { isLikelyImageAttachment } from "./supportAttachment";

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
