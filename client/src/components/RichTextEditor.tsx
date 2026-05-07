import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Heading4,
  Pilcrow,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  "data-testid"?: string;
}

const headingOptions = [
  { label: "Normaal", icon: Pilcrow, action: (editor: any) => editor.chain().focus().setParagraph().run(), isActive: (editor: any) => editor.isActive("paragraph") && !editor.isActive("heading") },
  { label: "Kop 1", icon: Heading2, action: (editor: any) => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (editor: any) => editor.isActive("heading", { level: 2 }) },
  { label: "Kop 2", icon: Heading3, action: (editor: any) => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (editor: any) => editor.isActive("heading", { level: 3 }) },
  { label: "Kop 3", icon: Heading4, action: (editor: any) => editor.chain().focus().toggleHeading({ level: 4 }).run(), isActive: (editor: any) => editor.isActive("heading", { level: 4 }) },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Schrijf hier...",
  minHeight = "120px",
  "data-testid": testId,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? "" : editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: "outline-none",
        ...(testId ? { "data-testid": testId } : {}),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentHTML = editor.isEmpty ? "" : editor.getHTML();
    if (currentHTML !== value) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const activeHeading = headingOptions.find((h) => h.isActive(editor)) ?? headingOptions[0];

  return (
    <div className="rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/40 px-2 py-1.5">
        {/* Heading / text-size dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs font-medium"
              data-testid="rte-heading-dropdown"
            >
              <activeHeading.icon className="h-3.5 w-3.5" />
              {activeHeading.label}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[130px]">
            {headingOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.label}
                onSelect={() => opt.action(editor)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  opt.isActive(editor) && "bg-accent"
                )}
                data-testid={`rte-heading-${opt.label.toLowerCase().replace(" ", "-")}`}
              >
                <opt.icon className="h-4 w-4" />
                <span
                  className={
                    opt.label === "Kop 1"
                      ? "text-base font-semibold"
                      : opt.label === "Kop 2"
                      ? "text-sm font-semibold"
                      : opt.label === "Kop 3"
                      ? "text-xs font-semibold"
                      : "text-sm"
                  }
                >
                  {opt.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Bold */}
        <Toggle
          type="button"
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          className="h-7 w-7 p-0"
          aria-label="Vet"
          data-testid="rte-bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Toggle>

        {/* Italic */}
        <Toggle
          type="button"
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          className="h-7 w-7 p-0"
          aria-label="Cursief"
          data-testid="rte-italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </Toggle>

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Bullet list */}
        <Toggle
          type="button"
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          className="h-7 w-7 p-0"
          aria-label="Opsommingstekens"
          data-testid="rte-bullet-list"
        >
          <List className="h-3.5 w-3.5" />
        </Toggle>

        {/* Ordered list */}
        <Toggle
          type="button"
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-7 w-7 p-0"
          aria-label="Genummerde lijst"
          data-testid="rte-ordered-list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Toggle>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="rich-text-editor px-3 py-2.5"
        style={{ minHeight }}
      />
    </div>
  );
}
