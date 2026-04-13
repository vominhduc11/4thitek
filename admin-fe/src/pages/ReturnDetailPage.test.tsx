// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReturnDetailPage from "./ReturnDetailPage";

const {
  fetchAdminReturnDetailMock,
  reviewAdminReturnRequestMock,
  receiveAdminReturnRequestMock,
  inspectAdminReturnItemMock,
  completeAdminReturnRequestMock,
  notifyMock,
} = vi.hoisted(() => ({
  fetchAdminReturnDetailMock: vi.fn(),
  reviewAdminReturnRequestMock: vi.fn(),
  receiveAdminReturnRequestMock: vi.fn(),
  inspectAdminReturnItemMock: vi.fn(),
  completeAdminReturnRequestMock: vi.fn(),
  notifyMock: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "admin-token",
  }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    language: "vi",
    t: (value: string) => value,
  }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({
    notify: notifyMock,
  }),
}));

vi.mock("../lib/adminApi", async () => {
  const actual = await vi.importActual("../lib/adminApi");
  return {
    ...actual,
    fetchAdminReturnDetail: fetchAdminReturnDetailMock,
    reviewAdminReturnRequest: reviewAdminReturnRequestMock,
    receiveAdminReturnRequest: receiveAdminReturnRequestMock,
    inspectAdminReturnItem: inspectAdminReturnItemMock,
    completeAdminReturnRequest: completeAdminReturnRequestMock,
  };
});

const SupportRouteProbe = () => {
  const location = useLocation();
  return <div data-testid="support-route-probe">{location.search}</div>;
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/returns/11"]}>
      <Routes>
        <Route path="/returns/:id" element={<ReturnDetailPage />} />
        <Route path="/support-tickets" element={<SupportRouteProbe />} />
      </Routes>
    </MemoryRouter>,
  );

const buildDetailPayload = () => ({
  id: 11,
  requestCode: "RET-11",
  dealerId: 5,
  dealerName: "Dealer A",
  orderId: 101,
  orderCode: "DH-001",
  type: "DEFECTIVE_RETURN",
  status: "SUBMITTED",
  requestedResolution: "REPLACE",
  reasonCode: "DEFECT",
  reasonDetail: "Factory issue",
  supportTicketId: 3,
  requestedAt: "2026-04-12T09:30:00Z",
  reviewedAt: null,
  receivedAt: null,
  completedAt: null,
  createdBy: "dealer-a",
  updatedBy: "dealer-a",
  createdAt: "2026-04-12T09:30:00Z",
  updatedAt: "2026-04-12T09:30:00Z",
  items: [
    {
      id: 21,
      orderItemId: 501,
      productId: 3001,
      productName: "Router AX",
      productSku: "AX-1",
      productSerialId: 9001,
      serialSnapshot: "SER-0001",
      itemStatus: "REQUESTED",
      conditionOnRequest: "DEFECTIVE",
      adminDecisionNote: null,
      inspectionNote: null,
      finalResolution: null,
      replacementOrderId: null,
      refundAmount: null,
      creditAmount: null,
      orderAdjustmentId: null,
    },
  ],
  attachments: [],
  events: [],
});

describe("ReturnDetailPage", () => {
  beforeEach(() => {
    fetchAdminReturnDetailMock.mockReset();
    reviewAdminReturnRequestMock.mockReset();
    receiveAdminReturnRequestMock.mockReset();
    inspectAdminReturnItemMock.mockReset();
    completeAdminReturnRequestMock.mockReset();
    notifyMock.mockReset();

    const detailPayload = buildDetailPayload();
    fetchAdminReturnDetailMock.mockResolvedValue(detailPayload);
    reviewAdminReturnRequestMock.mockResolvedValue(detailPayload);
    receiveAdminReturnRequestMock.mockResolvedValue(detailPayload);
    inspectAdminReturnItemMock.mockResolvedValue(detailPayload);
    completeAdminReturnRequestMock.mockResolvedValue(detailPayload);
  });

  afterEach(() => {
    cleanup();
  });

  it("loads return detail from backend", async () => {
    renderPage();

    await waitFor(() => {
      expect(fetchAdminReturnDetailMock).toHaveBeenCalledWith("admin-token", 11);
    });
    expect(await screen.findByText("RET-11")).toBeTruthy();
    expect(screen.getByText("SER-0001")).toBeTruthy();
  });

  it("submits review decisions for reviewable items", async () => {
    renderPage();
    await screen.findByText("RET-11");

    fireEvent.click(screen.getByRole("button", { name: "Save Review" }));

    await waitFor(() => {
      expect(reviewAdminReturnRequestMock).toHaveBeenCalledWith(
        "admin-token",
        11,
        {
          decisions: [
            {
              itemId: 21,
              approved: true,
              decisionNote: undefined,
            },
          ],
          awaitingReceipt: true,
        },
      );
    });
  });

  it("disables complete action while unresolved items exist", async () => {
    renderPage();
    await screen.findByText("RET-11");

    const completeButton = screen.getByRole("button", { name: "Complete" }) as HTMLButtonElement;
    expect(completeButton.disabled).toBe(true);
  });

  it("limits resolution options by selected inspection action", async () => {
    const inspectablePayload: any = buildDetailPayload();
    inspectablePayload.status = "INSPECTING";
    inspectablePayload.items = [
      {
        ...inspectablePayload.items[0],
        itemStatus: "INSPECTING",
      },
    ];
    fetchAdminReturnDetailMock.mockResolvedValueOnce(inspectablePayload);

    renderPage();
    await screen.findByText("RET-11");

    const actionSelect = screen.getByDisplayValue("Start inspection");
    const resolutionSelect = screen.getByDisplayValue("Not applicable");

    fireEvent.change(actionSelect, { target: { value: "PASS_QC" } });
    await waitFor(() => {
      expect(screen.getByDisplayValue("RESTOCK")).toBeTruthy();
    });
    expect(screen.queryByRole("option", { name: "REPLACE" })).toBeNull();
    expect(screen.queryByRole("option", { name: "REFUND" })).toBeNull();
    expect(screen.queryByRole("option", { name: "CREDIT NOTE" })).toBeNull();

    fireEvent.change(actionSelect, { target: { value: "SCRAP" } });
    fireEvent.change(resolutionSelect, { target: { value: "SCRAP" } });
    expect(screen.getByRole("option", { name: "REPLACE" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "REFUND" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "CREDIT NOTE" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "SCRAP" })).toBeTruthy();
  });

  it("renders replacement, refund, credit, and adjustment metadata on item card", async () => {
    const resolvedPayload: any = buildDetailPayload();
    resolvedPayload.status = "PARTIALLY_RESOLVED";
    resolvedPayload.items = [
      {
        ...resolvedPayload.items[0],
        itemStatus: "SCRAPPED",
        finalResolution: "REFUND",
        replacementOrderId: 77,
        refundAmount: 50000,
        creditAmount: 30000,
        orderAdjustmentId: 9001,
      },
    ];
    fetchAdminReturnDetailMock.mockResolvedValueOnce(resolvedPayload);

    renderPage();
    await screen.findByText("RET-11");

    expect(screen.getByText("Replacement order #77")).toBeTruthy();
    expect(screen.getByText("Refund amount: 50000")).toBeTruthy();
    expect(screen.getByText("Credit amount: 30000")).toBeTruthy();
    expect(screen.getByText("Adjustment reference #9001")).toBeTruthy();
  });

  it("navigates to support page with ticketId query", async () => {
    renderPage();
    await screen.findByText("RET-11");

    fireEvent.click(screen.getByRole("button", { name: "#3" }));

    await waitFor(() => {
      expect(screen.getByTestId("support-route-probe").textContent).toBe("?ticketId=3");
    });
  });
});
