import { useEffect, useRef } from 'react'

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    textarea.style.height = '0px'
    textarea.style.height = `${Math.max(textarea.scrollHeight, 220)}px`
  }, [value])

  void modules
  void formats

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
        HTML content editor
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        aria-label={ariaLabel ?? placeholder ?? 'Rich text editor'}
        className="min-h-[220px] w-full resize-y border-0 bg-white px-4 py-3 font-mono text-sm leading-6 text-slate-900 outline-none"
      />
    </div>
  )
}
