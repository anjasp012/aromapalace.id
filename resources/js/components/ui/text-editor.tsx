import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Link2,
    Unlink,
    Undo2,
    Redo2,
    Eraser,
    Code2,
    Eye,
    Heading2,
    Heading3,
    Type,
    Minus,
} from 'lucide-react';

interface TextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    className?: string;
    minHeight?: string;
}

export function TextEditor({
    value,
    onChange,
    placeholder = 'Tulis naskah artikel Anda di sini...',
    error,
    className,
    minHeight = '320px',
}: TextEditorProps) {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [isSourceMode, setIsSourceMode] = useState(false);
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        insertUnorderedList: false,
        insertOrderedList: false,
    });

    // Update active format states on selection change
    const updateActiveFormats = useCallback(() => {
        if (!editorRef.current || isSourceMode) return;
        try {
            setActiveFormats({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                strikeThrough: document.queryCommandState('strikeThrough'),
                insertUnorderedList: document.queryCommandState('insertUnorderedList'),
                insertOrderedList: document.queryCommandState('insertOrderedList'),
            });
        } catch {
            // queryCommandState might fail in certain browser states
        }
    }, [isSourceMode]);

    // Synchronize initial or external value changes with contentEditable element
    useEffect(() => {
        if (!editorRef.current) return;
        if (editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        // If content is just an empty br or whitespace tag, treat as empty
        if (html === '<p><br></p>' || html === '<br>' || html.trim() === '') {
            onChange('');
        } else {
            onChange(html);
        }
        updateActiveFormats();
    };

    const execCommand = (command: string, arg: string | undefined = undefined) => {
        if (isSourceMode) return;
        if (editorRef.current) {
            editorRef.current.focus();
        }
        document.execCommand(command, false, arg);
        handleInput();
        updateActiveFormats();
    };

    const handleHeading = (tag: 'h2' | 'h3' | 'p') => {
        if (isSourceMode) return;
        if (tag === 'p') {
            execCommand('formatBlock', '<p>');
        } else {
            execCommand('formatBlock', `<${tag}>`);
        }
    };

    const handleInsertLink = () => {
        if (isSourceMode) return;
        const previousUrl = '';
        const url = window.prompt('Masukkan tautan URL (contoh: https://...):', previousUrl);
        if (url !== null && url.trim() !== '') {
            execCommand('createLink', url.trim());
        }
    };

    const handleRemoveLink = () => {
        if (isSourceMode) return;
        execCommand('unlink');
    };

    const handleClearFormatting = () => {
        if (isSourceMode) return;
        execCommand('removeFormat');
    };

    // Calculate word & character counts
    const plainText = value.replace(/<[^>]*>/g, '').trim();
    const wordCount = plainText ? plainText.split(/\s+/).length : 0;
    const charCount = plainText.length;

    return (
        <div
            className={cn(
                'rounded-lg border border-input bg-card text-card-foreground shadow-xs transition-colors focus-within:ring-1 focus-within:ring-ring focus-within:border-ring overflow-hidden',
                error && 'border-destructive focus-within:ring-destructive',
                className
            )}
        >
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-1 border-b border-border bg-muted/40 px-2 py-1.5 text-muted-foreground select-none">
                <div className="flex flex-wrap items-center gap-0.5">
                    {/* Headings */}
                    <div className="flex items-center rounded-md border border-border/60 bg-background/60 p-0.5 mr-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleHeading('p')}
                            disabled={isSourceMode}
                            title="Paragraf Normal"
                            className="size-7 rounded-xs hover:bg-muted text-xs font-medium"
                        >
                            <Type className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleHeading('h2')}
                            disabled={isSourceMode}
                            title="Judul Utama (H2)"
                            className="size-7 rounded-xs hover:bg-muted"
                        >
                            <Heading2 className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleHeading('h3')}
                            disabled={isSourceMode}
                            title="Sub-judul (H3)"
                            className="size-7 rounded-xs hover:bg-muted"
                        >
                            <Heading3 className="size-3.5" />
                        </Button>
                    </div>

                    {/* Inline formatting */}
                    <div className="flex items-center rounded-md border border-border/60 bg-background/60 p-0.5 mr-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => execCommand('bold')}
                            disabled={isSourceMode}
                            title="Tebal (Ctrl+B)"
                            className={cn('size-7 rounded-xs', activeFormats.bold && 'bg-accent text-accent-foreground font-bold')}
                        >
                            <Bold className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => execCommand('italic')}
                            disabled={isSourceMode}
                            title="Miring (Ctrl+I)"
                            className={cn('size-7 rounded-xs', activeFormats.italic && 'bg-accent text-accent-foreground italic')}
                        >
                            <Italic className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => execCommand('underline')}
                            disabled={isSourceMode}
                            title="Garis Bawah (Ctrl+U)"
                            className={cn('size-7 rounded-xs', activeFormats.underline && 'bg-accent text-accent-foreground underline')}
                        >
                            <Underline className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => execCommand('strikeThrough')}
                            disabled={isSourceMode}
                            title="Coretan"
                            className={cn('size-7 rounded-xs', activeFormats.strikeThrough && 'bg-accent text-accent-foreground line-through')}
                        >
                            <Strikethrough className="size-3.5" />
                        </Button>
                    </div>

                    {/* Lists & Quotes */}
                    <div className="flex items-center rounded-md border border-border/60 bg-background/60 p-0.5 mr-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => execCommand('insertUnorderedList')}
                            disabled={isSourceMode}
                            title="Daftar Poin (Bullet List)"
                            className={cn('size-7 rounded-xs', activeFormats.insertUnorderedList && 'bg-accent text-accent-foreground')}
                        >
                            <List className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => execCommand('insertOrderedList')}
                            disabled={isSourceMode}
                            title="Daftar Nomor (Numbered List)"
                            className={cn('size-7 rounded-xs', activeFormats.insertOrderedList && 'bg-accent text-accent-foreground')}
                        >
                            <ListOrdered className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => execCommand('formatBlock', '<blockquote>')}
                            disabled={isSourceMode}
                            title="Kutipan (Quote)"
                            className="size-7 rounded-xs hover:bg-muted"
                        >
                            <Quote className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => execCommand('insertHorizontalRule')}
                            disabled={isSourceMode}
                            title="Garis Pemisah (Horizontal Line)"
                            className="size-7 rounded-xs hover:bg-muted"
                        >
                            <Minus className="size-3.5" />
                        </Button>
                    </div>

                    {/* Links */}
                    <div className="flex items-center rounded-md border border-border/60 bg-background/60 p-0.5 mr-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleInsertLink}
                            disabled={isSourceMode}
                            title="Sisipkan Tautan"
                            className="size-7 rounded-xs hover:bg-muted"
                        >
                            <Link2 className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleRemoveLink}
                            disabled={isSourceMode}
                            title="Hapus Tautan"
                            className="size-7 rounded-xs hover:bg-muted"
                        >
                            <Unlink className="size-3.5" />
                        </Button>
                    </div>

                    {/* Clear & History */}
                    <div className="flex items-center rounded-md border border-border/60 bg-background/60 p-0.5">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleClearFormatting}
                            disabled={isSourceMode}
                            title="Hapus Format Teks"
                            className="size-7 rounded-xs hover:bg-muted"
                        >
                            <Eraser className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => execCommand('undo')}
                            disabled={isSourceMode}
                            title="Undo (Ctrl+Z)"
                            className="size-7 rounded-xs hover:bg-muted"
                        >
                            <Undo2 className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => execCommand('redo')}
                            disabled={isSourceMode}
                            title="Redo (Ctrl+Y)"
                            className="size-7 rounded-xs hover:bg-muted"
                        >
                            <Redo2 className="size-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Mode Switch (Visual vs HTML Code) */}
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant={isSourceMode ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setIsSourceMode(!isSourceMode)}
                        className="h-7 px-2 text-xs gap-1.5"
                    >
                        {isSourceMode ? (
                            <>
                                <Eye className="size-3.5 text-primary" />
                                <span>Visual</span>
                            </>
                        ) : (
                            <>
                                <Code2 className="size-3.5" />
                                <span>Kode HTML</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Editor Area */}
            {isSourceMode ? (
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="<p>Masukkan kode HTML naskah artikel...</p>"
                    className="min-h-[320px] w-full rounded-none border-0 bg-muted/10 p-4 font-mono text-xs leading-relaxed focus-visible:ring-0 shadow-none resize-y"
                    style={{ minHeight }}
                />
            ) : (
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onKeyUp={updateActiveFormats}
                    onMouseUp={updateActiveFormats}
                    data-placeholder={placeholder}
                    style={{ minHeight }}
                    className={cn(
                        'w-full p-4 text-sm leading-relaxed text-foreground outline-none focus:outline-none overflow-y-auto',
                        'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none',
                        // Typography styles inside the editor
                        '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:border-l-3 [&_h2]:border-primary [&_h2]:pl-3',
                        '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2',
                        '[&_p]:my-2.5 [&_p]:leading-relaxed',
                        '[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/60 [&_blockquote]:bg-muted/40 [&_blockquote]:p-3 [&_blockquote]:rounded-r-md [&_blockquote]:italic [&_blockquote]:text-muted-foreground',
                        '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:space-y-1',
                        '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:space-y-1',
                        '[&_li]:leading-relaxed',
                        '[&_a]:text-primary [&_a]:underline [&_a]:font-medium',
                        '[&_hr]:my-4 [&_hr]:border-border'
                    )}
                />
            )}

            {/* Footer with Stats */}
            <div className="flex items-center justify-between border-t border-border bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
                <span className="italic">
                    {isSourceMode ? 'Mode Editor HTML' : 'Mode Editor Visual (WYSIWYG)'}
                </span>
                <div className="flex items-center gap-3">
                    <span>{wordCount} kata</span>
                    <span>•</span>
                    <span>{charCount} karakter</span>
                </div>
            </div>
        </div>
    );
}
