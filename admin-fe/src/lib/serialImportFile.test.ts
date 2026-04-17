import { describe, expect, it } from 'vitest'
import * as xlsx from 'xlsx'
import { parseSerialImportFile } from './serialImportFile'

type MockFileInput = {
  name: string
  textContent?: string
  arrayBufferContent?: ArrayBuffer
}

const createMockFile = ({
  name,
  textContent = '',
  arrayBufferContent = new ArrayBuffer(0),
}: MockFileInput): File =>
  ({
    name,
    text: async () => textContent,
    arrayBuffer: async () => arrayBufferContent,
  }) as unknown as File

const createExcelBuffer = (rows: Array<Array<string | number>>) => {
  const workbook = xlsx.utils.book_new()
  const worksheet = xlsx.utils.aoa_to_sheet(rows)
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  const workbookData = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' })
  return workbookData instanceof ArrayBuffer
    ? workbookData
    : workbookData.buffer.slice(
        workbookData.byteOffset,
        workbookData.byteOffset + workbookData.byteLength,
      )
}

describe('parseSerialImportFile', () => {
  it('parses csv and normalizes uppercase values', async () => {
    const result = await parseSerialImportFile(
      createMockFile({
        name: 'serials.csv',
        textContent: 'serial\nsn0001,sn0002\nsn0003',
      }),
    )

    expect(result.fileName).toBe('serials.csv')
    expect(result.totalRows).toBe(3)
    expect(result.validSerials).toEqual(['SN0001', 'SN0002', 'SN0003'])
    expect(result.duplicateSerials).toEqual([])
    expect(result.invalidSerials).toEqual([])
  })

  it('parses txt, removes blank rows, and detects duplicates and invalid serials', async () => {
    const result = await parseSerialImportFile(
      createMockFile({
        name: 'serials.txt',
        textContent: '\n sn001 \nSN001\nab\nbad@\n',
      }),
    )

    expect(result.totalRows).toBe(4)
    expect(result.validSerials).toEqual(['SN001'])
    expect(result.duplicateSerials).toEqual(['SN001'])
    expect(result.invalidSerials).toEqual(['AB', 'BAD@'])
  })

  it('parses first excel sheet and prefers serial header column', async () => {
    const result = await parseSerialImportFile(
      createMockFile({
        name: 'serials.xlsx',
        arrayBufferContent: createExcelBuffer([
          ['product_name', 'serials'],
          ['P1', 'sn1001'],
          ['P2', 'sn1002'],
          ['P3', 'sn1002'],
          ['P4', 'bad*'],
          ['P5', ''],
        ]),
      }),
    )

    expect(result.totalRows).toBe(4)
    expect(result.validSerials).toEqual(['SN1001', 'SN1002'])
    expect(result.duplicateSerials).toEqual(['SN1002'])
    expect(result.invalidSerials).toEqual(['BAD*'])
  })

  it('uses the first column when excel header is missing', async () => {
    const result = await parseSerialImportFile(
      createMockFile({
        name: 'serials-no-header.xlsx',
        arrayBufferContent: createExcelBuffer([
          ['sn2001', 'ignore'],
          ['sn2002', 'ignore'],
        ]),
      }),
    )

    expect(result.totalRows).toBe(2)
    expect(result.validSerials).toEqual(['SN2001', 'SN2002'])
    expect(result.duplicateSerials).toEqual([])
    expect(result.invalidSerials).toEqual([])
  })
})
