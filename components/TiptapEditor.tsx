'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import { useCallback, useEffect, useRef } from 'react'
import TurndownService from 'turndown'
import Showdown from 'showdown'

// Markdown → HTML converter
const showdown = new Showdown.Converter({
    tables: true,
    tasklists: true,
    strikethrough: true,
    simpleLineBreaks: false,
})

// HTML → Markdown converter
const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
})

// Add table support to turndown
turndown.addRule('table', {
    filter: 'table',
    replacement: function (_content, node) {
        const table = node as HTMLTableElement
        const rows = Array.from(table.rows)
        if (rows.length === 0) return ''

        const lines: string[] = []
        rows.forEach((row, i) => {
            const cells = Array.from(row.cells).map(c => c.textContent?.trim() || '')
            lines.push('| ' + cells.join(' | ') + ' |')
            if (i === 0) {
                lines.push('|' + cells.map(() => '---').join('|') + '|')
            }
        })
        return '\n' + lines.join('\n') + '\n'
    }
})

turndown.addRule('taskList', {
    filter: (node) => node.nodeName === 'LI' && node.getAttribute('data-type') === 'taskItem',
    replacement: (content, node) => {
        const checked = (node as HTMLElement).getAttribute('data-checked') === 'true'
        return `- [${checked ? 'x' : ' '}] ${content.trim()}\n`
    }
})

interface TiptapEditorProps {
    content: string // markdown
    onChange: (markdown: string) => void
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
    const isInitializing = useRef(true)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3, 4] },
            }),
            Link.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder: 'Start writing your article…' }),
            Highlight,
            TaskList,
            TaskItem.configure({ nested: true }),
            Table.configure({ resizable: false }),
            TableRow,
            TableCell,
            TableHeader,
            Image,
        ],
        content: showdown.makeHtml(content),
        editorProps: {
            attributes: {
                class: 'tiptap-content outline-none min-h-[500px] px-4 py-3',
            },
        },
        onUpdate: ({ editor }) => {
            if (isInitializing.current) return
            const html = editor.getHTML()
            const md = turndown.turndown(html)
            onChange(md)
        },
    })

    useEffect(() => {
        // Mark initialization complete after first render
        const timeout = setTimeout(() => { isInitializing.current = false }, 200)
        return () => clearTimeout(timeout)
    }, [])

    // Sync external content changes (e.g., loading from API)
    useEffect(() => {
        if (editor && isInitializing.current) {
            const html = showdown.makeHtml(content)
            editor.commands.setContent(html)
        }
    }, [content, editor])

    const MenuButton = useCallback(({ isActive, onClick, children, title }: {
        isActive?: boolean
        onClick: () => void
        children: React.ReactNode
        title: string
    }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${
                isActive ? 'bg-[#0046ff] text-white' : 'text-[#535862] hover:bg-[#F5F1DC]'
            }`}
        >
            {children}
        </button>
    ), [])

    if (!editor) return null

    return (
        <div className="border border-[#E9EAEB] rounded-xl bg-white overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-[#E9EAEB] bg-[#FAFAFA] flex-wrap">
                <MenuButton
                    isActive={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    title="Heading 1"
                >H1</MenuButton>
                <MenuButton
                    isActive={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    title="Heading 2"
                >H2</MenuButton>
                <MenuButton
                    isActive={editor.isActive('heading', { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    title="Heading 3"
                >H3</MenuButton>

                <span className="w-px h-5 bg-[#E9EAEB] mx-1" />

                <MenuButton
                    isActive={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold"
                ><strong>B</strong></MenuButton>
                <MenuButton
                    isActive={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic"
                ><em>I</em></MenuButton>
                <MenuButton
                    isActive={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    title="Strikethrough"
                ><s>S</s></MenuButton>
                <MenuButton
                    isActive={editor.isActive('code')}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    title="Inline Code"
                ><code className="text-xs">&lt;/&gt;</code></MenuButton>

                <span className="w-px h-5 bg-[#E9EAEB] mx-1" />

                <MenuButton
                    isActive={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    title="Bullet List"
                >• List</MenuButton>
                <MenuButton
                    isActive={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    title="Numbered List"
                >1. List</MenuButton>
                <MenuButton
                    isActive={editor.isActive('taskList')}
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    title="Task List"
                >☑ Tasks</MenuButton>

                <span className="w-px h-5 bg-[#E9EAEB] mx-1" />

                <MenuButton
                    isActive={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    title="Blockquote"
                >" Quote</MenuButton>
                <MenuButton
                    isActive={editor.isActive('codeBlock')}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    title="Code Block"
                >Code</MenuButton>
                <MenuButton
                    isActive={false}
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Horizontal Rule"
                >— HR</MenuButton>

                <span className="w-px h-5 bg-[#E9EAEB] mx-1" />

                <MenuButton
                    isActive={false}
                    onClick={() => {
                        const url = window.prompt('Enter link URL:')
                        if (url) editor.chain().focus().setLink({ href: url }).run()
                    }}
                    title="Add Link"
                >🔗 Link</MenuButton>
                <MenuButton
                    isActive={false}
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    title="Insert Table"
                >Table</MenuButton>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />
        </div>
    )
}
