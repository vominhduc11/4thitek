import { useEffect, useRef } from "react";
import {
  EditorContent,
  useEditor,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Redo2,
  RotateCcw,
  Undo2,
} from "lucide-react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  modules?: Record<string, unknown>;
  formats?: string[];
  placeholder?: string;
  readOnly?: boolean;
  ariaLabel?: string;
};

type ToolbarButtonProps = {
  icon: typeof Bold;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
};

const DEFAULT_ARIA_LABEL = "Trình soạn thảo nội dung";
const EMPTY_HTML = "";
const EMPTY_DOCUMENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

const sanitizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }

  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  if (/^[^\s]+\.[^\s]+/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return null;
};

const normalizeInlineText = (value: string) =>
  value.replace(/\u00a0/g, " ").replace(/\s+/g, " ");

const sanitizeHtml = (value: string) => {
  if (!value.trim() || typeof window === "undefined") {
    return EMPTY_HTML;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(value, "text/html");
  const allowedTags = new Set([
    "p",
    "br",
    "hr",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
  ]);

  const sanitizeNode = (node: Node, targetDocument: Document): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      const normalizedText = normalizeInlineText(node.textContent ?? "");
      return normalizedText.trim() ? targetDocument.createTextNode(normalizedText) : null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    if (!allowedTags.has(tagName)) {
      const fragment = targetDocument.createDocumentFragment();
      Array.from(element.childNodes).forEach((child) => {
        const sanitizedChild = sanitizeNode(child, targetDocument);
        if (sanitizedChild) {
          fragment.appendChild(sanitizedChild);
        }
      });
      return fragment.childNodes.length > 0 ? fragment : null;
    }

    const normalizedTag =
      tagName === "b" ? "strong" : tagName === "i" ? "em" : tagName;
    const nextElement = targetDocument.createElement(normalizedTag);

    if (normalizedTag === "a") {
      const href = sanitizeUrl(element.getAttribute("href") ?? "");
      if (!href) {
        const fragment = targetDocument.createDocumentFragment();
        Array.from(element.childNodes).forEach((child) => {
          const sanitizedChild = sanitizeNode(child, targetDocument);
          if (sanitizedChild) {
            fragment.appendChild(sanitizedChild);
          }
        });
        return fragment.childNodes.length > 0 ? fragment : null;
      }
      nextElement.setAttribute("href", href);
      nextElement.setAttribute("rel", "noopener noreferrer nofollow");
      if (/^https?:/i.test(href)) {
        nextElement.setAttribute("target", "_blank");
      }
    }

    if (normalizedTag === "hr" || normalizedTag === "br") {
      return nextElement;
    }

    Array.from(element.childNodes).forEach((child) => {
      const sanitizedChild = sanitizeNode(child, targetDocument);
      if (sanitizedChild) {
        nextElement.appendChild(sanitizedChild);
      }
    });

    const textContent = nextElement.textContent?.trim() ?? "";
    if (!textContent && nextElement.childNodes.length === 0) {
      return ["p", "li", "blockquote"].includes(normalizedTag) ? null : nextElement;
    }

    return nextElement;
  };

  const cleanDocument = document.implementation.createHTMLDocument("");
  const fragment = cleanDocument.createDocumentFragment();

  Array.from(document.body.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, cleanDocument);
    if (sanitizedChild) {
      fragment.appendChild(sanitizedChild);
    }
  });

  const container = cleanDocument.createElement("div");
  container.appendChild(fragment);
  const normalizedHtml = container.innerHTML.trim();
  return normalizedHtml === "<p></p>" ? EMPTY_HTML : normalizedHtml;
};

const ToolbarButton = ({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: ToolbarButtonProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    disabled={disabled}
    className={[
      "inline-flex min-h-10 min-w-10 items-center justify-center rounded-[14px] border px-2.5 transition",
      active
        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-sm"
        : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--ink)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]",
      disabled ? "cursor-not-allowed opacity-50" : "",
    ].join(" ")}
  >
    <Icon className="h-4 w-4" />
  </button>
);

const setLink = (editor: Editor | null) => {
  if (!editor) return;

  const currentHref = String(editor.getAttributes("link").href ?? "");
  const input = window.prompt(
    "Nhập liên kết. Để trống nếu muốn bỏ liên kết.",
    currentHref || "https://",
  );

  if (input === null) {
    return;
  }

  const normalizedHref = sanitizeUrl(input);
  if (!input.trim()) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  if (!normalizedHref) {
    window.alert("Liên kết không hợp lệ. Vui lòng dùng URL http(s), mailto, tel hoặc tên miền hợp lệ.");
    return;
  }

  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: normalizedHref })
    .run();
};

export const RichTextEditor = ({
  value,
  onChange,
  modules,
  formats,
  placeholder,
  readOnly = false,
  ariaLabel,
}: RichTextEditorProps) => {
  const normalizedValueRef = useRef(EMPTY_HTML);
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;
  normalizedValueRef.current = sanitizeHtml(value);
  void modules;
  void formats;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Nhập nội dung mô tả",
      }),
    ],
    content: normalizedValueRef.current || EMPTY_DOCUMENT,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "ProseMirror min-h-[220px] px-4 py-3 text-sm leading-7 text-[var(--ink)] focus:outline-none",
        "aria-label": ariaLabel ?? placeholder ?? DEFAULT_ARIA_LABEL,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextHtml = currentEditor.isEmpty
        ? EMPTY_HTML
        : sanitizeHtml(currentEditor.getHTML());

      if (nextHtml !== normalizedValueRef.current) {
        normalizedValueRef.current = nextHtml;
        onChangeRef.current(nextHtml);
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.isEmpty ? EMPTY_HTML : sanitizeHtml(editor.getHTML());
    const nextHtml = normalizedValueRef.current;
    if (currentHtml === nextHtml) {
      return;
    }
    editor.commands.setContent(nextHtml || EMPTY_DOCUMENT, { emitUpdate: false });
  }, [editor, value]);

  const isToolbarDisabled = readOnly || !editor;

  return (
    <div className="wysiwyg-editor overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_14px_30px_rgba(11,24,38,0.08)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Trình soạn thảo nội dung
          </span>
          <ToolbarButton
            icon={Heading1}
            label="Tiêu đề cấp 1"
            active={editor?.isActive("heading", { level: 1 })}
            disabled={isToolbarDisabled}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          />
          <ToolbarButton
            icon={Heading2}
            label="Tiêu đề cấp 2"
            active={editor?.isActive("heading", { level: 2 })}
            disabled={isToolbarDisabled}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolbarButton
            icon={Heading3}
            label="Tiêu đề cấp 3"
            active={editor?.isActive("heading", { level: 3 })}
            disabled={isToolbarDisabled}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          />
          <ToolbarButton
            icon={Bold}
            label="In đậm"
            active={editor?.isActive("bold")}
            disabled={isToolbarDisabled}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            icon={Italic}
            label="In nghiêng"
            active={editor?.isActive("italic")}
            disabled={isToolbarDisabled}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            icon={List}
            label="Danh sách chấm"
            active={editor?.isActive("bulletList")}
            disabled={isToolbarDisabled}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            icon={ListOrdered}
            label="Danh sách số"
            active={editor?.isActive("orderedList")}
            disabled={isToolbarDisabled}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            icon={Link2}
            label="Chèn liên kết"
            active={editor?.isActive("link")}
            disabled={isToolbarDisabled}
            onClick={() => setLink(editor)}
          />
          <ToolbarButton
            icon={Minus}
            label="Chèn đường phân cách"
            disabled={isToolbarDisabled}
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          />
          <ToolbarButton
            icon={Undo2}
            label="Hoàn tác"
            disabled={isToolbarDisabled || !editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
          />
          <ToolbarButton
            icon={Redo2}
            label="Làm lại"
            disabled={isToolbarDisabled || !editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
          />
          <ToolbarButton
            icon={RotateCcw}
            label="Đưa về đoạn văn"
            disabled={isToolbarDisabled}
            onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
          />
        </div>
      </div>
      <div className="bg-[var(--surface)]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
