import { afterEach, describe, expect, it, vi } from "vitest";
import { storeFileReference } from "./upload";

describe("storeFileReference", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps upload URL for preview and sanitizes legacy stored-path file names", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            url: "/api/v1/upload/support/evidence/dealers/1/9d0e914f-proof.jpg",
            fileName: "support/evidence/dealers/1/9d0e914f-proof.jpg",
            storedPath: "support/evidence/dealers/1/9d0e914f-proof.jpg",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const file = new File(["proof"], "proof.jpg", { type: "image/jpeg" });
    const result = await storeFileReference({
      file,
      category: "support-tickets",
      accessToken: "admin-token",
    });

    expect(result.fileName).toBe("9d0e914f-proof.jpg");
    expect(result.url).toBe(
      "/api/v1/upload/support/evidence/dealers/1/9d0e914f-proof.jpg",
    );
    expect(result.previewUrl).toContain(
      "/api/v1/upload/support/evidence/dealers/1/9d0e914f-proof.jpg",
    );
    expect(result.storedPath).toBe("support/evidence/dealers/1/9d0e914f-proof.jpg");
  });

  it("falls back to the uploaded URL file segment when backend metadata omits fileName", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            url: "/api/v1/upload/support/evidence/dealers/1/new-proof.jpg",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const file = new File(["proof"], "human-proof.jpg", { type: "image/jpeg" });
    const result = await storeFileReference({
      file,
      category: "support-tickets",
      accessToken: "admin-token",
    });

    expect(result.fileName).toBe("new-proof.jpg");
  });

  it("normalizes legacy /uploads support URLs to authenticated preview URLs", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            url: "/uploads/support/evidence/1/638c7523-2267-4c58-b7aa-dd94042fe9e1.png",
            fileName: "638c7523-2267-4c58-b7aa-dd94042fe9e1.png",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const file = new File(["proof"], "proof.png", { type: "image/png" });
    const result = await storeFileReference({
      file,
      category: "support-tickets",
      accessToken: "admin-token",
    });

    expect(result.previewUrl).toContain(
      "/api/v1/upload/support/evidence/1/638c7523-2267-4c58-b7aa-dd94042fe9e1.png",
    );
  });
});
