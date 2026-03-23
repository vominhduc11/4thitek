import type { BackendSerialImportSkippedItem } from '../lib/adminApi'

export const buildSkippedSerialRetryValue = (items: BackendSerialImportSkippedItem[]) =>
  items
    .map((item) => item.serial.trim())
    .filter(Boolean)
    .join('\n')
