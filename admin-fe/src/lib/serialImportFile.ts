const SUPPORTED_SERIAL_IMPORT_EXTENSIONS = ['csv', 'txt', 'xlsx', 'xls'] as const

export const SERIAL_FORMAT = /^[A-Z0-9][A-Z0-9-_.]{3,63}$/i

export type SerialImportFileParseResult = {
  fileName: string
  totalRows: number
  validSerials: string[]
  duplicateSerials: string[]
  invalidSerials: string[]
}

type SupportedSerialImportExtension = (typeof SUPPORTED_SERIAL_IMPORT_EXTENSIONS)[number]
type ParseSummary = Omit<SerialImportFileParseResult, 'fileName'>
type SpreadsheetCell = string | number | boolean | Date | null | undefined
type SpreadsheetRow = SpreadsheetCell[]

const SUPPORTED_EXTENSION_SET = new Set<SupportedSerialImportExtension>(
  SUPPORTED_SERIAL_IMPORT_EXTENSIONS,
)

const normalizeSerial = (value: string) => value.trim().toUpperCase()
const isSerialHeader = (value: string) => {
  const normalized = value.trim().toLowerCase()
  return normalized === 'serial' || normalized === 'serials'
}

const getFileExtension = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex < 0 || dotIndex === fileName.length - 1) {
    return ''
  }
  return fileName.slice(dotIndex + 1).toLowerCase()
}

const asString = (value: SpreadsheetCell) => (value == null ? '' : String(value))

const readSerialValuesFromSpreadsheet = async (file: File): Promise<string[]> => {
  const xlsx = await import('xlsx')
  const workbook = xlsx.read(await file.arrayBuffer(), { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    return []
  }

  const firstSheet = workbook.Sheets[firstSheetName]
  if (!firstSheet) {
    return []
  }

  const rows = xlsx.utils.sheet_to_json<SpreadsheetRow>(firstSheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  })
  if (rows.length === 0) {
    return []
  }

  const firstNonEmptyRowIndex = rows.findIndex((row) =>
    row.some((cell) => asString(cell).trim().length > 0),
  )
  if (firstNonEmptyRowIndex < 0) {
    return []
  }

  const headerColumnIndex = rows[firstNonEmptyRowIndex].findIndex((cell) =>
    isSerialHeader(asString(cell)),
  )
  const selectedColumnIndex = headerColumnIndex >= 0 ? headerColumnIndex : 0
  const startRowIndex = headerColumnIndex >= 0 ? firstNonEmptyRowIndex + 1 : 0
  const values: string[] = []

  for (let rowIndex = startRowIndex; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    values.push(asString(row?.[selectedColumnIndex]))
  }

  return values
}

export const splitSerialTextValues = (content: string) =>
  content
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean)

const readSerialValuesFromPlainText = (content: string) => {
  const tokens = splitSerialTextValues(content.replace(/^\uFEFF/, ''))
  if (tokens.length > 0 && isSerialHeader(tokens[0])) {
    return tokens.slice(1)
  }
  return tokens
}

const summarizeSerialValues = (values: string[]): ParseSummary => {
  const normalizedValues = values.map(normalizeSerial).filter(Boolean)
  const validSerials: string[] = []
  const duplicateSerials: string[] = []
  const invalidSerials: string[] = []
  const seenValidSerials = new Set<string>()
  const seenDuplicateSerials = new Set<string>()
  const seenInvalidSerials = new Set<string>()

  for (const serial of normalizedValues) {
    if (!SERIAL_FORMAT.test(serial)) {
      if (!seenInvalidSerials.has(serial)) {
        invalidSerials.push(serial)
        seenInvalidSerials.add(serial)
      }
      continue
    }

    if (seenValidSerials.has(serial)) {
      if (!seenDuplicateSerials.has(serial)) {
        duplicateSerials.push(serial)
        seenDuplicateSerials.add(serial)
      }
      continue
    }

    seenValidSerials.add(serial)
    validSerials.push(serial)
  }

  return {
    totalRows: normalizedValues.length,
    validSerials,
    duplicateSerials,
    invalidSerials,
  }
}

export const isValidSerialFormat = (value: string) => SERIAL_FORMAT.test(value)

export const parseSerialImportFile = async (file: File): Promise<SerialImportFileParseResult> => {
  const extension = getFileExtension(file.name)
  if (!SUPPORTED_EXTENSION_SET.has(extension as SupportedSerialImportExtension)) {
    throw new Error('Dinh dang file khong duoc ho tro. Chi nhan .csv, .txt, .xlsx, .xls.')
  }

  try {
    const serialValues =
      extension === 'xlsx' || extension === 'xls'
        ? await readSerialValuesFromSpreadsheet(file)
        : readSerialValuesFromPlainText(await file.text())

    return {
      fileName: file.name,
      ...summarizeSerialValues(serialValues),
    }
  } catch {
    throw new Error('Khong the doc file import serial. Vui long kiem tra noi dung file.')
  }
}
