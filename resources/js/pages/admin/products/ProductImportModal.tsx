import React, { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    FileSpreadsheet,
    Upload,
    Download,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RefreshCw,
    FileText,
    ArrowRight,
    Sparkles,
    Trash2,
} from 'lucide-react';

interface PreviewRow {
    index: number;
    brand_name: string;
    brand_id: number | null;
    brand_status: 'found' | 'new' | 'empty';
    product_name: string;
    product_status: 'new' | 'exists';
    price_raw: string;
    price_clean: number;
    price_formatted: string;
    varian_name: string;
    volume: number;
    is_valid: boolean;
}

interface PreviewData {
    rows: PreviewRow[];
    total_rows: number;
    valid_rows: number;
    brands_found_count: number;
    brands_new_count: number;
    products_new_count: number;
    products_existing_count: number;
}

interface ProductImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SAMPLE_PASTE_DATA = `Brand\tProduct\tPrice\tVarian
AL FARES\tAl Fares Khayal Al Faris Edp inspired by Parfums De Marly Greenley\t412,500\t100 ml`;

export default function ProductImportModal({ open, onOpenChange }: ProductImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [tab, setTab] = useState<'upload' | 'paste'>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [rawText, setRawText] = useState<string>('');
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [normalizedRows, setNormalizedRows] = useState<Array<{ brand: string; product: string; price: string; varian: string }>>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [isImporting, setIsImporting] = useState<boolean>(false);

    const getCsrfToken = (): string => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) {
            return decodeURIComponent(match[1]);
        }
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta?.getAttribute('content') || '';
    };

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setErrorMessage(null);
        setPreviewData(null);
        triggerPreview(file, '');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const triggerPreview = async (file: File | null, text: string) => {
        setIsLoadingPreview(true);
        setErrorMessage(null);

        const formData = new FormData();
        if (file) {
            formData.append('file', file);
        } else if (text.trim()) {
            formData.append('raw_text', text);
        } else {
            setIsLoadingPreview(false);
            setErrorMessage('Silakan pilih file atau masukkan teks data produk.');
            return;
        }

        try {
            const response = await fetch('/manajemen-produk/import/preview', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                setErrorMessage(result.message || 'Gagal memproses data import.');
                setPreviewData(null);
                setNormalizedRows([]);
            } else {
                setPreviewData(result.data);
                setNormalizedRows(result.normalized_rows || []);
                setErrorMessage(null);
            }
        } catch {
            setErrorMessage('Terjadi kesalahan jaringan saat memproses pratinjau data.');
            setPreviewData(null);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleExecuteImport = () => {
        if (!normalizedRows || normalizedRows.length === 0) {
            setErrorMessage('Tidak ada data yang valid untuk diimpor.');
            return;
        }

        setIsImporting(true);
        setErrorMessage(null);

        router.post(
            '/manajemen-produk/import',
            { rows: normalizedRows },
            {
                preserveScroll: true,
                onSuccess: () => {
                    handleReset();
                    onOpenChange(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    setErrorMessage(firstError || 'Terjadi kesalahan saat mengimpor produk.');
                },
                onFinish: () => {
                    setIsImporting(false);
                },
            }
        );
    };

    const handleReset = () => {
        setSelectedFile(null);
        setRawText('');
        setPreviewData(null);
        setNormalizedRows([]);
        setErrorMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleQuickSample = () => {
        setRawText(SAMPLE_PASTE_DATA);
        triggerPreview(null, SAMPLE_PASTE_DATA);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <FileSpreadsheet className="size-5" />
                                </div>
                                <DialogTitle className="text-lg font-bold">Import Produk dari Excel / CSV</DialogTitle>
                            </div>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Format 4 kolom: <span className="font-semibold text-foreground">Brand</span> &bull; <span className="font-semibold text-foreground">Product</span> &bull; <span className="font-semibold text-foreground">Price</span> &bull; <span className="font-semibold text-foreground">Varian</span>.
                                Seluruh produk otomatis disimpan sebagai <span className="font-semibold text-amber-600 dark:text-amber-400">Draft</span> terlebih dahulu (tidak langsung tayang di toko) dan tanpa gambar palsu (tampilan otomatis abu-abu netral).
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 gap-1.5 text-xs self-start sm:self-auto cursor-pointer border-dashed"
                        >
                            <a href="/manajemen-produk/import/template" download>
                                <Download className="size-3.5 text-primary" />
                                <span>Unduh Template (.CSV)</span>
                            </a>
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Input Methods Tab */}
                    {!previewData && (
                        <Tabs
                            value={tab}
                            onValueChange={(val) => {
                                setTab(val as 'upload' | 'paste');
                                setErrorMessage(null);
                            }}
                            className="w-full"
                        >
                            <TabsList className="grid grid-cols-2 max-w-sm mb-4">
                                <TabsTrigger value="upload" className="text-xs gap-1.5 cursor-pointer">
                                    <Upload className="size-3.5" />
                                    <span>Upload File Excel/CSV</span>
                                </TabsTrigger>
                                <TabsTrigger value="paste" className="text-xs gap-1.5 cursor-pointer">
                                    <FileText className="size-3.5" />
                                    <span>Copy-Paste Teks</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab 1: Upload File */}
                            <TabsContent value="upload" className="mt-0 space-y-3">
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                                        isDragging
                                            ? 'border-primary bg-primary/5 scale-[0.99]'
                                            : selectedFile
                                            ? 'border-emerald-500 bg-emerald-500/5'
                                            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                                    }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv,.txt"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleFileSelect(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Upload className="size-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">
                                            {selectedFile ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    File dipilih: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                                </span>
                                            ) : (
                                                'Klik untuk memilih file atau seret file ke sini'
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Mendukung file Excel (.xlsx, .xls) dan CSV (.csv) hingga 10MB
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Tab 2: Copy-Paste Textarea */}
                            <TabsContent value="paste" className="mt-0 space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Tempel baris tabel yang di-copy langsung dari Excel / Spreadsheet:
                                        </label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleQuickSample}
                                            className="h-6 text-[11px] gap-1 text-primary cursor-pointer"
                                        >
                                            <Sparkles className="size-3" />
                                            <span>Contoh AL FARES</span>
                                        </Button>
                                    </div>
                                    <Textarea
                                        rows={6}
                                        placeholder={`Brand\tProduct\tPrice\tVarian\nAL FARES\tAl Fares Khayal Al Faris Edp inspired by Parfums De Marly Greenley\t412,500\t100 ml`}
                                        value={rawText}
                                        onChange={(e) => setRawText(e.target.value)}
                                        className="font-mono text-xs leading-relaxed"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => triggerPreview(null, rawText)}
                                        disabled={!rawText.trim() || isLoadingPreview}
                                        className="gap-2 cursor-pointer text-xs"
                                    >
                                        {isLoadingPreview ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <ArrowRight className="size-3.5" />
                                        )}
                                        <span>Proses &amp; Tinjau Data</span>
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}

                    {/* Loading State Indicator */}
                    {isLoadingPreview && (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                            <Loader2 className="size-8 animate-spin text-primary" />
                            <p className="text-xs font-medium">Membaca dan menganalisis kolom Excel...</p>
                        </div>
                    )}

                    {/* Error Alert */}
                    {errorMessage && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold">Perhatian</p>
                                <p>{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Preview Table & Summary Metrics */}
                    {previewData && (
                        <div className="space-y-4">
                            {/* Summary Metric Pills */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-3 rounded-lg bg-muted/60 border space-y-1">
                                    <span className="text-[11px] text-muted-foreground font-medium">Total Baris</span>
                                    <div className="text-lg font-bold text-foreground">{previewData.total_rows} Baris</div>
                                </div>
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Brand Ditemukan</span>
                                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                        {previewData.brands_found_count} Cocok
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
                                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Brand Baru</span>
                                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                        {previewData.brands_new_count} Didaftarkan
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1">
                                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Produk Baru</span>
                                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        {previewData.products_new_count} Produk
                                    </div>
                                </div>
                            </div>

                            {/* Table of Parsed Rows */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-muted/70 px-4 py-2 border-b flex items-center justify-between text-xs">
                                    <span className="font-semibold text-foreground">
                                        Pratinjau Data ({previewData.rows.length} baris)
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleReset}
                                        className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        <RefreshCw className="size-3" />
                                        <span>Ganti File / Teks</span>
                                    </Button>
                                </div>
                                <div className="max-h-72 overflow-y-auto">
                                    <table className="w-full text-xs caption-bottom">
                                        <thead className="bg-muted/40 sticky top-0 border-b text-muted-foreground text-[11px]">
                                            <tr>
                                                <th className="h-8 px-3 text-left font-medium w-12">No</th>
                                                <th className="h-8 px-3 text-left font-medium">Brand</th>
                                                <th className="h-8 px-3 text-left font-medium">Nama Produk</th>
                                                <th className="h-8 px-3 text-left font-medium">Harga</th>
                                                <th className="h-8 px-3 text-left font-medium">Varian</th>
                                                <th className="h-8 px-3 text-center font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {previewData.rows.map((row) => (
                                                <tr key={row.index} className="hover:bg-muted/30 transition-colors">
                                                    <td className="p-3 text-muted-foreground">{row.index}</td>
                                                    <td className="p-3 font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{row.brand_name}</span>
                                                            {row.brand_status === 'found' ? (
                                                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-1 py-0">
                                                                    ID: {row.brand_id}
                                                                </Badge>
                                                            ) : row.brand_status === 'new' ? (
                                                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 px-1 py-0">
                                                                    + Baru
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="max-w-xs truncate" title={row.product_name}>
                                                            {row.product_name}
                                                        </div>
                                                        {row.product_status === 'exists' && (
                                                            <span className="text-[10px] text-blue-600 dark:text-blue-400">
                                                                (Sudah ada &bull; varian ditambahkan)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                                                        {row.price_formatted}
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {row.varian_name}
                                                        </Badge>
                                                        {row.volume > 0 && (
                                                            <span className="text-[10px] text-muted-foreground ml-1.5">
                                                                ({row.volume}ml)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium">
                                                            Draft
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isImporting}
                        className="text-xs cursor-pointer"
                    >
                        Tutup
                    </Button>

                    <div className="flex items-center gap-2">
                        {previewData && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                disabled={isImporting}
                                className="text-xs cursor-pointer gap-1.5"
                            >
                                <Trash2 className="size-3.5" />
                                <span>Reset Data</span>
                            </Button>
                        )}

                        <Button
                            type="button"
                            size="sm"
                            onClick={handleExecuteImport}
                            disabled={!previewData || isImporting || previewData.rows.length === 0}
                            className="text-xs gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Sedang Mengimpor...</span>
                                </>
                            ) : (
                                <>
                                    <FileSpreadsheet className="size-3.5" />
                                    <span>
                                        Mulai Import {previewData ? `(${previewData.rows.length} Data)` : ''}
                                    </span>
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

