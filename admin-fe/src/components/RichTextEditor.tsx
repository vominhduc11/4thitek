import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  modules?: Record<string, unknown>
  formats?: string[]
  placeholder?: string
  readOnly?: boolean
  ariaLabel?: string
}

export const RichTextEditor = ({
  value,
  onChange,
  modules,
  formats,
  placeholder,
  readOnly,
  ariaLabel,
}: RichTextEditorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<Quill | null>(null)
  const toolbarRef = useRef<HTMLElement | null>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return

    const container = containerRef.current
    const instance = new Quill(container, {
      theme: 'snow',
      modules,
      formats,
      placeholder,
      readOnly,
    })

    quillRef.current = instance
    const toolbarModule = instance.getModule('toolbar') as { container?: HTMLElement } | null
    toolbarRef.current = toolbarModule?.container ?? null

    const handleChange = () => {
      const html = instance.root.innerHTML
      if (html !== valueRef.current) {
        onChangeRef.current(html)
      }
    }

    instance.root.setAttribute('aria-label', ariaLabel ?? placeholder ?? 'Rich text editor')
    instance.root.setAttribute('aria-multiline', 'true')
    instance.on('text-change', handleChange)

    if (valueRef.current) {
      instance.clipboard.dangerouslyPasteHTML(valueRef.current, 'silent')
    } else {
      instance.setText('', 'silent')
    }

    return () => {
      const toolbarContainer = toolbarRef.current
      instance.off('text-change', handleChange)
      quillRef.current = null
      if (toolbarContainer?.parentNode) {
        toolbarContainer.parentNode.removeChild(toolbarContainer)
      }
      toolbarRef.current = null
      container.innerHTML = ''
    }
  }, [ariaLabel, formats, modules, placeholder, readOnly])

  useEffect(() => {
    const instance = quillRef.current
    if (!instance) return

    const currentHtml = instance.root.innerHTML
    if (value !== currentHtml) {
      const selection = instance.getSelection()
      instance.clipboard.dangerouslyPasteHTML(value || '', 'silent')
      if (selection) {
        instance.setSelection(selection)
      }
    }
  }, [value])

  return <div ref={containerRef} />
}
