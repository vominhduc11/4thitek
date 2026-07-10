import {
  BackendReportExportType,
  BackendReportFormat,
  authorizedBlobRequest,
} from './client'

export const exportAdminReport = (
  token: string,
  type: BackendReportExportType,
  format: BackendReportFormat,
  dateRange?: { from?: string; to?: string },
) =>
  authorizedBlobRequest({
    path: '/admin/reports/export',
    token,
    params: { type, format, from: dateRange?.from, to: dateRange?.to },
    fallbackFileName: `${type.toLowerCase()}-report.${format.toLowerCase()}`,
  })
