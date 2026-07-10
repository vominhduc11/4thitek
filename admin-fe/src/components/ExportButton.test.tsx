// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const notifyMock = vi.fn();
vi.mock("../context/ToastContext", () => ({
  useToast: () => ({ notify: notifyMock }),
}));
vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({ language: "vi", t: (value: string) => value }),
}));

import { ExportButton } from "./ExportButton";

describe("ExportButton", () => {
  afterEach(() => {
    cleanup();
    notifyMock.mockReset();
  });

  it("runs the export on click without an error toast", async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(<ExportButton onExport={onExport} label="Xuất CSV" />);

    fireEvent.click(screen.getByRole("button"));
    expect(onExport).toHaveBeenCalledOnce();

    await waitFor(() =>
      expect(screen.getByRole("button").getAttribute("aria-busy")).toBeNull(),
    );
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("surfaces an error toast when the export fails", async () => {
    const onExport = vi.fn().mockRejectedValue(new Error("boom"));
    render(<ExportButton onExport={onExport} label="Xuất CSV" />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith("boom", {
        title: "Xuất CSV",
        variant: "error",
      }),
    );
  });
});
