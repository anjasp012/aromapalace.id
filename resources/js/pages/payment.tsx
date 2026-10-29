import React, { useRef, useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Clock, CheckCircle2, Copy, Check, ArrowRight, Upload, HourglassIcon, Building2, CreditCard } from 'lucide-react';
import { useEcho } from '@laravel/echo-react';
import { useTranslation } from '@/lib/i18n';

interface BankDetails {
    bank_name: string;
    account_number: string;
    account_name: string;
}

interface PaymentProps {
    order: {
        id: number;
        order_number: string;
        recipient_name?: string;
        created_at?: string;
        payment_method: string;
        payment_channel: string;
        payment_code: string;
        payment_status: string;
        status?: string;
        is_manual?: boolean;
        bank_details?: BankDetails | null;
        payment_proof?: string | null;
        payment_proof_uploaded_at?: string | null;
        payment_proof_uploaded_at_formatted?: string | null;
        payment_sender_name?: string | null;
        payment_notes?: string | null;
        total_amount: number;
        total_amount_formatted: string;
    };
}

function PaymentContent({ order }: PaymentProps) {
    const { isEn } = useTranslation();

    const isManual = !!order.is_manual;
    const isWaitingConfirmation = order.status === 'menunggu_konfirmasi';
    const isPaid = order.payment_status === 'paid' || order.status === 'diproses' || order.status === 'dikirim' || order.status === 'selesai';
    const isCanceled = order.payment_status === 'canceled' || order.payment_status === 'cancelled' || order.status === 'dibatalkan';
    const isQris = order.payment_method === 'qris';
    const isPaymentLink = order.payment_method === 'payment_link' || order.payment_code?.startsWith('http');
    const hasUploadedProof = !!order.payment_proof;

    // 24 hour countdown timer calculated from order creation time
    const [timeLeft, setTimeLeft] = useState<number>(() => {
        if (order.created_at) {
            const expiryMs = new Date(order.created_at).getTime() + 24 * 3600 * 1000;
            const nowMs = Date.now();
            return Math.max(0, Math.floor((expiryMs - nowMs) / 1000));
        }
        return 23 * 3600 + 59 * 60 + 21;
    });

    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedAmount, setCopiedAmount] = useState(false);
    const [copiedAccount, setCopiedAccount] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>(isQris ? 'qris_app' : 'atm');
    const [isChecking, setIsChecking] = useState(false);
    const [checkMessage, setCheckMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);

    const manualForm = useForm({
        payment_proof: null as File | null,
        payment_sender_name: '',
        payment_notes: '',
    });

    // Real-time WebSocket: listen for OrderPaid and ShippingUpdated via Laravel Reverb
    useEcho(
        isPaid || isCanceled ? '' : `orders.${order.order_number}`,
        ['.OrderPaid', 'OrderPaid', '.ShippingUpdated', 'ShippingUpdated'],
        () => {
            // Payment approved or rejected via WebSocket / Admin action — reload order data instantly
            router.reload({ only: ['order'] });
        },
        [order.order_number, isPaid, isCanceled],
        'public',
    );

    // Smart Fallback: background poll every 5s while waiting for payment
    // (Stop polling for menunggu_konfirmasi — user has uploaded proof, admin must confirm)
    useEffect(() => {
        if (isPaid || isCanceled || isWaitingConfirmation || typeof window === 'undefined') return;

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['order'] });
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isPaid, isCanceled, isWaitingConfirmation]);

    // Countdown tick — paused once proof is uploaded (menunggu_konfirmasi)
    useEffect(() => {
        if (isPaid || isCanceled || isWaitingConfirmation) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [isPaid, isCanceled, isWaitingConfirmation]);

    // Auto-trigger check / cancel when timer hits 0 (only for non-confirmed orders)
    useEffect(() => {
        if (timeLeft === 0 && !isPaid && !isCanceled && !isWaitingConfirmation) {
            router.post(`/payment/${order.order_number}/check`, {}, { preserveScroll: true });
        }
    }, [timeLeft, isPaid, isCanceled, isWaitingConfirmation, order.order_number]);

    const hours = String(Math.floor(timeLeft / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0');
    const seconds = String(timeLeft % 60).padStart(2, '0');

    const handleCopy = (text: string, type: 'code' | 'amount' | 'account') => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(text);
        }
        if (type === 'code') {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } else if (type === 'amount') {
            setCopiedAmount(true);
            setTimeout(() => setCopiedAmount(false), 2000);
        } else {
            setCopiedAccount(true);
            setTimeout(() => setCopiedAccount(false), 2000);
        }
    };

    const handleCheckStatus = () => {
        setIsChecking(true);
        setCheckMessage(null);

        router.post(
            `/payment/${order.order_number}/check`,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsChecking(false);
                },
                onSuccess: () => {
                    if (order.payment_status === 'paid') {
                        setCheckMessage(isEn ? 'Payment confirmed successfully!' : 'Pembayaran terkonfirmasi lunas!');
                    } else if (order.payment_status === 'canceled' || order.status === 'dibatalkan') {
                        setCheckMessage(isEn ? 'Order has been canceled.' : 'Pesanan telah dibatalkan.');
                    } else {
                        setCheckMessage(isEn ? 'Payment has not been received yet. Please complete the transaction.' : 'Pembayaran belum diterima. Silakan selesaikan transaksi.');
                        setTimeout(() => setCheckMessage(null), 4000);
                    }
                },
            }
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setSelectedFile(file);
        manualForm.setData('payment_proof', file);
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setFilePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        manualForm.post(`/payment/${order.order_number}/confirm-manual`, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    // Render Bank / Payment Logo
    const renderPaymentLogo = () => {
        const method = order.payment_method?.toLowerCase() || '';

        if (isQris) {
            return (
                <div className="px-2.5 py-1 rounded bg-rose-600 text-white font-black text-xs tracking-wider select-none shadow-xs">
                    QRIS
                </div>
            );
        }

        if (method.includes('bca')) {
            return (
                <div className="flex items-center gap-1.5 select-none" title="Bank Central Asia (BCA)">
                    <div className="w-6 h-6 rounded-full bg-[#005BAB] flex items-center justify-center p-1">
                        <svg className="w-full h-full text-white fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.93V18h-2v-1.07A4.004 4.004 0 0 1 8 13h2a2 2 0 1 0 4 0c0-1.1-.9-2-2-2s-4-.9-4-4a4.004 4.004 0 0 1 3-3.93V3h2v1.07A4.004 4.004 0 0 1 16 8h-2a2 2 0 1 0-4 0c0 1.1.9 2 2 2s4 .9 4 4c0 1.86-1.28 3.41-3 3.93z" />
                        </svg>
                    </div>
                    <span className="font-black text-[#005BAB] text-lg tracking-tighter italic">BCA</span>
                </div>
            );
        }

        if (method.includes('mandiri')) {
            return (
                <div className="flex items-center gap-1 select-none">
                    <span className="font-black text-[#002B66] text-base tracking-tight">mandiri</span>
                    <span className="w-2.5 h-1.5 bg-[#F9A825] rounded-xs"></span>
                </div>
            );
        }

        if (method.includes('bni')) {
            return (
                <div className="flex items-center select-none font-black text-[#F15A24] text-lg tracking-tight">
                    BNI
                </div>
            );
        }

        if (method.includes('bri')) {
            return (
                <div className="flex items-center select-none font-black text-[#00529C] text-lg tracking-tight">
                    BRI
                </div>
            );
        }

        if (method.includes('bsi')) {
            return (
                <div className="flex items-center gap-1 select-none">
                    <span className="font-black text-[#00A39D] text-lg tracking-tight">BSI</span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">Syariah</span>
                </div>
            );
        }

        if (method.includes('cimb')) {
            return (
                <div className="flex items-center select-none font-black text-[#ED1C24] text-base tracking-tight">
                    CIMB NIAGA
                </div>
            );
        }

        if (method.includes('danamon')) {
            return (
                <div className="flex items-center select-none font-black text-[#FF6600] text-base tracking-tight">
                    DANAMON
                </div>
            );
        }

        if (method.includes('maybank')) {
            return (
                <div className="flex items-center select-none font-black text-[#D69E2E] text-base tracking-tight">
                    MAYBANK
                </div>
            );
        }

        if (method.includes('bnc') || method.includes('neo')) {
            return (
                <div className="flex items-center select-none font-black text-[#B7791F] text-base tracking-tight">
                    BNC NEO
                </div>
            );
        }

        if (method.includes('muamalat')) {
            return (
                <div className="flex items-center gap-1 select-none">
                    <span className="font-black text-[#7B2082] text-base tracking-tight">MUAMALAT</span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Syariah</span>
                </div>
            );
        }

        if (method.includes('ocbc')) {
            return (
                <div className="flex items-center select-none font-black text-[#EB1C24] text-base tracking-tight">
                    OCBC
                </div>
            );
        }

        if (isPaymentLink || method.includes('payment_link')) {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#4A070B] text-[#E8D0BA] font-extrabold text-xs tracking-wider select-none shadow-xs">
                    PORTAL
                </div>
            );
        }

        return (
            <div className="px-2 py-0.5 rounded bg-muted text-foreground font-bold text-xs">
                {order.payment_channel || 'VA'}
            </div>
        );
    };

    // Method display title
    const methodDisplayName = isQris
        ? (isEn ? 'Realtime QRIS' : 'QRIS Realtime')
        : order.payment_method?.includes('va')
        ? order.payment_channel || 'Virtual Account'
        : order.payment_channel || (isEn ? 'Bank Transfer' : 'Transfer Bank');

    return (
        <Layout>
            <Head
                title={
                    isPaid
                        ? (isEn ? `Payment Successful #${order.order_number} • Aroma Palace` : `Pembayaran Berhasil #${order.order_number} • Aroma Palace`)
                        : isCanceled
                        ? (isEn ? `Order Canceled #${order.order_number} • Aroma Palace` : `Pesanan Dibatalkan #${order.order_number} • Aroma Palace`)
                        : (isEn ? `Complete Payment #${order.order_number} • Aroma Palace` : `Selesaikan Pembayaran #${order.order_number} • Aroma Palace`)
                }
            />

            {/* PAGE HEADER BANNER (Consistent with cart.tsx & checkout.tsx) */}
            <div className="border-b border-border/70 bg-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        {isPaid ? (
                            <>
                                <span className="font-light">{isEn ? 'Payment' : 'Konfirmasi'}</span>{' '}
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">{isEn ? 'Confirmation' : 'Pembayaran'}</span>
                            </>
                        ) : isCanceled ? (
                            <>
                                <span className="font-light">{isEn ? 'Order' : 'Pesanan'}</span>{' '}
                                <span className="font-bold text-rose-700 dark:text-rose-400">{isEn ? 'Canceled' : 'Dibatalkan'}</span>
                            </>
                        ) : (
                            <>
                                <span className="font-light">{isEn ? 'Complete' : 'Selesaikan'}</span>{' '}
                                <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">{isEn ? 'Payment' : 'Pembayaran'}</span>
                            </>
                        )}
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {isPaid
                            ? (isEn ? `Fragrance order #${order.order_number} has been verified and fully paid.` : `Pesanan wewangian nomor #${order.order_number} telah berhasil dikonfirmasi lunas.`)
                            : isCanceled
                            ? (isEn ? `The 24-hour payment limit for order #${order.order_number} has expired and the reserved items were returned to inventory.` : `Batas waktu pembayaran 24 jam untuk pesanan #${order.order_number} telah berakhir dan stok telah dikembalikan ke inventaris.`)
                            : (isEn ? `Complete your payment within the given time limit to finish order #${order.order_number}.` : `Lakukan pembayaran sesuai batas waktu yang ditentukan untuk menyelesaikan pesanan #${order.order_number}.`)}
                    </p>
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {isPaid ? (
                    /* ======================================================== */
                    /* SUCCESS STATE: PEMBAYARAN BERHASIL */
                    /* ======================================================== */
                    <div className="w-full max-w-[500px] mx-auto bg-card/70 backdrop-blur-xs border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-none space-y-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>

                        <div className="space-y-2">
                            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                {isEn ? 'Payment Complete' : 'Pembayaran Lunas'}
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                {isEn ? 'Thank You For Your Payment' : 'Terima Kasih Atas Pembayaran Anda'}
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {isEn ? (
                                    <>
                                        Order transaction <strong className="text-foreground">#{order.order_number}</strong> has been successfully verified. Our curators are preparing your luxurious fragrance.
                                    </>
                                ) : (
                                    <>
                                        Transaksi pesanan <strong className="text-foreground">#{order.order_number}</strong> telah berhasil diverifikasi lunas. Kurator kami sedang menyiapkan wewangian mewah pesanan Anda.
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="bg-muted/40 rounded-xl p-4 border border-border/80 text-xs space-y-2.5 text-left">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">{isEn ? 'Order Number:' : 'Nomor Pesanan:'}</span>
                                <span className="font-bold text-foreground">{order.order_number}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">{isEn ? 'Total Payment:' : 'Total Pembayaran:'}</span>
                                <span className="font-extrabold text-foreground">{order.total_amount_formatted}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">{isEn ? 'Payment Method:' : 'Metode Pembayaran:'}</span>
                                <span className="font-semibold text-foreground">{order.payment_channel}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Link href="/account/orders" className="block w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-11 rounded-md font-bold text-xs sm:text-sm text-foreground border-border/80 hover:bg-muted/50 cursor-pointer shadow-none"
                                >
                                    {isEn ? 'Order History' : 'Riwayat Pesanan'}
                                </Button>
                            </Link>
                            <Link href="/products" className="block w-full">
                                <Button
                                    type="button"
                                    className="w-full h-11 rounded-md font-bold text-xs sm:text-sm bg-[#FFC400] hover:bg-[#E5B000] text-black shadow-none cursor-pointer transition active:scale-[0.98]"
                                >
                                    {isEn ? 'Shop Again' : 'Belanja Lagi'}
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : isCanceled ? (
                    /* ======================================================== */
                    /* CANCELED / EXPIRED STATE: PESANAN DIBATALKAN */
                    /* ======================================================== */
                    <div className="w-full max-w-[500px] mx-auto bg-card/70 backdrop-blur-xs border border-rose-500/30 rounded-2xl p-6 sm:p-8 shadow-none space-y-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
                            <AlertCircle className="w-8 h-8" />
                        </div>

                        <div className="space-y-2">
                            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                {isEn ? 'Order Canceled (24h Expired)' : 'Pesanan Dibatalkan (Lewat 24 Jam)'}
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                {isEn ? 'Payment Time Has Expired' : 'Batas Waktu Pembayaran Telah Habis'}
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {isEn ? (
                                    <>
                                        Payment for order <strong className="text-foreground">#{order.order_number}</strong> was not completed within the 24-hour limit. All reserved items have been safely returned to inventory.
                                    </>
                                ) : (
                                    <>
                                        Pembayaran untuk pesanan <strong className="text-foreground">#{order.order_number}</strong> tidak diselesaikan dalam batas waktu 24 jam. Stok parfum pesanan Anda telah dikembalikan secara otomatis.
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="bg-muted/40 rounded-xl p-4 border border-border/80 text-xs space-y-2.5 text-left">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">{isEn ? 'Order Number:' : 'Nomor Pesanan:'}</span>
                                <span className="font-bold text-foreground">{order.order_number}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">{isEn ? 'Total Payment:' : 'Total Pembayaran:'}</span>
                                <span className="font-extrabold text-foreground">{order.total_amount_formatted}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">{isEn ? 'Status:' : 'Status Pesanan:'}</span>
                                <span className="font-semibold text-rose-600 dark:text-rose-400">{isEn ? 'Canceled' : 'Dibatalkan'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Link href="/account/orders" className="block w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-11 rounded-md font-bold text-xs sm:text-sm text-foreground border-border/80 hover:bg-muted/50 cursor-pointer shadow-none"
                                >
                                    {isEn ? 'Order History' : 'Riwayat Pesanan'}
                                </Button>
                            </Link>
                            <Link href="/products" className="block w-full">
                                <Button
                                    type="button"
                                    className="w-full h-11 rounded-md font-bold text-xs sm:text-sm bg-[#FFC400] hover:bg-[#E5B000] text-black shadow-none cursor-pointer transition active:scale-[0.98]"
                                >
                                    {isEn ? 'Reorder Now' : 'Pesan Ulang'}
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : isManual ? (
                    /* ======================================================== */
                    /* MANUAL PAYMENT STATE: TRANSFER BANK MANUAL */
                    /* ======================================================== */
                    <div className="w-full max-w-[520px] mx-auto space-y-4">

                        {/* 24-Hour Countdown Timer — hidden once proof is uploaded */}
                        {!isWaitingConfirmation && (
                            <div className="bg-card/60 backdrop-blur-xs border border-border/80 rounded-2xl p-4 sm:p-5 text-center space-y-1">
                                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{isEn ? 'Payment deadline (24 hours from order)' : 'Batas waktu bayar (24 jam sejak pesan)'}</span>
                                </div>
                                <div className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${timeLeft < 3600 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                                    {hours} {isEn ? 'hrs' : 'jam'} : {minutes} {isEn ? 'min' : 'menit'} : {seconds} {isEn ? 'sec' : 'detik'}
                                </div>
                                {timeLeft < 3600 && (
                                    <p className="text-[11px] text-rose-500 font-medium">
                                        {isEn ? 'Less than 1 hour remaining! Upload your proof now.' : 'Kurang dari 1 jam lagi! Segera unggah bukti transfer Anda.'}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Waiting Confirmation Banner */}
                        {isWaitingConfirmation && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800">
                                <HourglassIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                        {isEn ? 'Awaiting Admin Verification' : 'Menunggu Verifikasi Admin'}
                                    </p>
                                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                                        {isEn
                                            ? 'Your transfer proof has been received. Our team will verify it within 1×24 hours on business days.'
                                            : 'Bukti transfer Anda telah kami terima. Tim kami akan memverifikasi dalam 1×24 jam kerja.'}
                                    </p>
                                    {order.payment_proof_uploaded_at_formatted && (
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-mono">
                                            {isEn ? 'Uploaded:' : 'Diunggah:'} {order.payment_proof_uploaded_at_formatted}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bank Details Card */}
                        {order.bank_details && (
                            <div className="bg-card/70 backdrop-blur-xs border border-border/80 rounded-2xl p-6 sm:p-7 shadow-none space-y-4">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <h2 className="text-sm font-bold text-foreground">
                                        {isEn ? 'Transfer to this account' : 'Transfer ke rekening berikut'}
                                    </h2>
                                </div>

                                {/* Bank Name */}
                                <div className="bg-muted/40 rounded-xl p-4 border border-border/60 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">{isEn ? 'Bank' : 'Bank'}</span>
                                        <span className="font-extrabold text-sm text-foreground">{order.bank_details.bank_name}</span>
                                    </div>
                                    <div className="border-t border-border/60" />
                                    {/* Account Number */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-xs text-muted-foreground block">{isEn ? 'Account Number' : 'Nomor Rekening'}</span>
                                            <span className="font-black text-base text-foreground font-mono tracking-wider mt-0.5 block">
                                                {order.bank_details.account_number}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(order.bank_details!.account_number, 'account')}
                                            className="rounded-md border border-border/80 hover:bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground flex items-center gap-1.5 transition cursor-pointer select-none"
                                        >
                                            {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                            <span>{copiedAccount ? (isEn ? 'Copied' : 'Tersalin') : (isEn ? 'Copy' : 'Salin')}</span>
                                        </button>
                                    </div>
                                    <div className="border-t border-border/60" />
                                    {/* Account Name */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">{isEn ? 'Account Holder' : 'Atas Nama'}</span>
                                        <span className="font-bold text-sm text-foreground">{order.bank_details.account_name}</span>
                                    </div>
                                    <div className="border-t border-border/60" />
                                    {/* Total Amount */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">{isEn ? 'Transfer Amount' : 'Jumlah Transfer'}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-base text-[#4A070B] dark:text-[#E8D0BA]">{order.total_amount_formatted}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(String(order.total_amount), 'amount')}
                                                className="rounded-md border border-border/80 hover:bg-muted/60 px-2 py-1 text-xs font-semibold text-foreground flex items-center gap-1 transition cursor-pointer select-none"
                                            >
                                                {copiedAmount ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* Cara Pembayaran Accordion */}
                        {order.bank_details && (
                            <div className="bg-card/70 backdrop-blur-xs border border-border/80 rounded-2xl p-5 sm:p-6 shadow-none">
                                <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide">
                                    {isEn ? 'Payment Instructions' : 'Cara Pembayaran'}
                                </p>
                                <div className="divide-y divide-border/60">

                                    {/* ATM */}
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setOpenAccordion(openAccordion === 'atm' ? null : 'atm')}
                                            className="w-full py-3 flex items-center justify-between text-left font-semibold text-sm text-foreground hover:text-foreground/80 transition cursor-pointer"
                                        >
                                            <span>ATM {order.bank_details.bank_name}</span>
                                            <svg className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openAccordion === 'atm' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {openAccordion === 'atm' && (
                                            <ol className="list-decimal list-inside text-[11.5px] text-muted-foreground space-y-1.5 pb-3 pl-1 leading-relaxed">
                                                {isEn ? (
                                                    <>
                                                        <li>Insert your ATM card and enter your PIN.</li>
                                                        <li>Select <strong>Other Transactions</strong> &gt; <strong>Transfer</strong> &gt; <strong>To {order.bank_details.bank_name} Account</strong> (or <strong>To Other Bank</strong> if using a different bank card).</li>
                                                        <li>Enter destination account number: <strong className="text-foreground font-mono">{order.bank_details.account_number}</strong>, then press Correct.</li>
                                                        <li>Enter the exact transfer amount: <strong className="text-foreground font-mono">{order.total_amount_formatted}</strong>.</li>
                                                        <li>Verify recipient name: <strong className="text-foreground">{order.bank_details.account_name}</strong>. If correct, select <strong>Yes/Correct</strong> to complete the transfer.</li>
                                                        <li>Save the receipt, then take a photo and upload it in the <strong>Upload Transfer Proof</strong> form below.</li>
                                                    </>
                                                ) : (
                                                    <>
                                                        <li>Masukkan kartu ATM dan PIN Anda.</li>
                                                        <li>Pilih menu <strong>Transaksi Lainnya</strong> &gt; <strong>Transfer</strong> &gt; <strong>Ke Rekening {order.bank_details.bank_name}</strong> (atau <strong>Ke Rekening Bank Lain</strong> jika menggunakan kartu bank selain {order.bank_details.bank_name}).</li>
                                                        <li>Masukkan nomor rekening tujuan: <strong className="text-foreground font-mono">{order.bank_details.account_number}</strong> lalu tekan Benar.</li>
                                                        <li>Masukkan nominal transfer tepat sejumlah: <strong className="text-foreground font-mono">{order.total_amount_formatted}</strong>.</li>
                                                        <li>Periksa nama penerima: <strong className="text-foreground">{order.bank_details.account_name}</strong>. Jika sesuai, pilih <strong>Ya/Benar</strong> untuk menyelesaikan transfer.</li>
                                                        <li>Simpan struk bukti transfer, lalu foto dan unggah pada formulir <strong>Unggah Bukti Transfer</strong> di bawah.</li>
                                                    </>
                                                )}
                                            </ol>
                                        )}
                                    </div>

                                    {/* Mobile Banking */}
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setOpenAccordion(openAccordion === 'mbanking' ? null : 'mbanking')}
                                            className="w-full py-3 flex items-center justify-between text-left font-semibold text-sm text-foreground hover:text-foreground/80 transition cursor-pointer"
                                        >
                                            <span>Mobile Banking {order.bank_details.bank_name}</span>
                                            <svg className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openAccordion === 'mbanking' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {openAccordion === 'mbanking' && (
                                            <ol className="list-decimal list-inside text-[11.5px] text-muted-foreground space-y-1.5 pb-3 pl-1 leading-relaxed">
                                                {isEn ? (
                                                    <>
                                                        <li>Open the {order.bank_details.bank_name} mobile app and log in with your credentials.</li>
                                                        <li>Select <strong>m-Transfer</strong> &gt; <strong>Between Accounts</strong> (or <strong>Inter-Bank</strong> if from a different bank).</li>
                                                        <li>Enter destination account number <strong className="text-foreground font-mono">{order.bank_details.account_number}</strong> on behalf of <strong className="text-foreground">{order.bank_details.account_name}</strong>.</li>
                                                        <li>Enter the exact transfer amount: <strong className="text-foreground font-mono">{order.total_amount_formatted}</strong>.</li>
                                                        <li>Review the transfer details, then confirm and enter your PIN.</li>
                                                        <li>Save the screenshot of the successful transfer and upload it in the <strong>Upload Transfer Proof</strong> form below.</li>
                                                    </>
                                                ) : (
                                                    <>
                                                        <li>Buka aplikasi <strong>{order.bank_details.bank_name} mobile</strong> dan masukkan kode akses/PIN Anda.</li>
                                                        <li>Pilih menu <strong>m-Transfer</strong> &gt; <strong>Antar Rekening</strong> (atau <strong>Antar Bank</strong> jika dari bank lain).</li>
                                                        <li>Masukkan nomor rekening tujuan <strong className="text-foreground font-mono">{order.bank_details.account_number}</strong> atas nama <strong className="text-foreground">{order.bank_details.account_name}</strong>.</li>
                                                        <li>Masukkan nominal transfer tepat sejumlah: <strong className="text-foreground font-mono">{order.total_amount_formatted}</strong>.</li>
                                                        <li>Periksa rincian transfer, lalu konfirmasi dan masukkan PIN transaksi Anda.</li>
                                                        <li>Simpan tangkapan layar (<em>screenshot</em>) bukti transfer berhasil, lalu unggah pada formulir <strong>Unggah Bukti Transfer</strong> di bawah.</li>
                                                    </>
                                                )}
                                            </ol>
                                        )}
                                    </div>

                                    {/* Internet Banking */}
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setOpenAccordion(openAccordion === 'ibanking' ? null : 'ibanking')}
                                            className="w-full py-3 flex items-center justify-between text-left font-semibold text-sm text-foreground hover:text-foreground/80 transition cursor-pointer"
                                        >
                                            <span>Internet Banking</span>
                                            <svg className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openAccordion === 'ibanking' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {openAccordion === 'ibanking' && (
                                            <ol className="list-decimal list-inside text-[11.5px] text-muted-foreground space-y-1.5 pb-3 pl-1 leading-relaxed">
                                                {isEn ? (
                                                    <>
                                                        <li>Log in to your bank's Internet Banking portal with your User ID and PIN.</li>
                                                        <li>Select <strong>Fund Transfer</strong> &gt; <strong>Transfer to {order.bank_details.bank_name} Account</strong> (or <strong>Transfer to Other Bank</strong>).</li>
                                                        <li>Enter destination account number <strong className="text-foreground font-mono">{order.bank_details.account_number}</strong> on behalf of <strong className="text-foreground">{order.bank_details.account_name}</strong>.</li>
                                                        <li>Enter the exact transfer amount: <strong className="text-foreground font-mono">{order.total_amount_formatted}</strong>.</li>
                                                        <li>Enter your security token (KeyBCA/OTP) to complete the transaction.</li>
                                                        <li>Save the transfer receipt (receipt/PDF/screenshot) and upload it in the <strong>Upload Transfer Proof</strong> form below.</li>
                                                    </>
                                                ) : (
                                                    <>
                                                        <li>Login ke layanan Internet Banking Anda dengan User ID dan PIN.</li>
                                                        <li>Pilih menu <strong>Transfer Dana</strong> &gt; <strong>Transfer ke Rekening {order.bank_details.bank_name}</strong> (atau <strong>Transfer ke Bank Lain</strong>).</li>
                                                        <li>Masukkan nomor rekening tujuan <strong className="text-foreground font-mono">{order.bank_details.account_number}</strong> atas nama <strong className="text-foreground">{order.bank_details.account_name}</strong>.</li>
                                                        <li>Masukkan nominal transfer tepat sejumlah: <strong className="text-foreground font-mono">{order.total_amount_formatted}</strong>.</li>
                                                        <li>Masukkan respon dari token keamanan Anda (KeyBCA/OTP) untuk menyelesaikan transaksi.</li>
                                                        <li>Simpan bukti transfer (struk/PDF/screenshot), lalu unggah pada formulir <strong>Unggah Bukti Transfer</strong> di bawah.</li>
                                                    </>
                                                )}
                                            </ol>
                                        )}
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* Upload Proof of Transfer */}
                        {!isPaid && (
                            <div className="bg-card/70 backdrop-blur-xs border border-border/80 rounded-2xl p-6 sm:p-7 shadow-none space-y-4">
                                <div className="flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-muted-foreground" />
                                    <h2 className="text-sm font-bold text-foreground">
                                        {isWaitingConfirmation
                                            ? (isEn ? 'Update Transfer Proof' : 'Perbarui Bukti Transfer')
                                            : (isEn ? 'Upload Transfer Proof' : 'Unggah Bukti Transfer')}
                                    </h2>
                                </div>

                                {/* Already uploaded proof preview */}
                                {hasUploadedProof && order.payment_proof && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground font-medium">{isEn ? 'Current proof:' : 'Bukti saat ini:'}</p>
                                        <a href={order.payment_proof} target="_blank" rel="noopener noreferrer"
                                            className="block rounded-lg border border-border/60 overflow-hidden hover:opacity-90 transition"
                                        >
                                            <img src={order.payment_proof} alt="Payment proof" className="w-full max-h-40 object-cover" />
                                        </a>
                                        {order.payment_sender_name && (
                                            <p className="text-[11px] text-muted-foreground">
                                                {isEn ? 'Sender:' : 'Pengirim:'} <strong className="text-foreground">{order.payment_sender_name}</strong>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <form onSubmit={handleManualSubmit} className="space-y-3">
                                    {/* Sender Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground mb-1">
                                            {isEn ? 'Sender Account Name' : 'Nama Pemilik Rekening Pengirim'}
                                            <span className="text-rose-500 ml-0.5">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={manualForm.data.payment_sender_name}
                                            onChange={(e) => manualForm.setData('payment_sender_name', e.target.value)}
                                            placeholder={isEn ? 'e.g. John Doe' : 'mis. Budi Santoso'}
                                            className="w-full h-10 rounded-lg border border-border/80 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4A070B]/30 dark:focus:ring-[#E8D0BA]/30"
                                        />
                                        {manualForm.errors.payment_sender_name && (
                                            <p className="text-xs text-rose-500 mt-1">{manualForm.errors.payment_sender_name}</p>
                                        )}
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground mb-1">
                                            {isEn ? 'Transfer Receipt (Photo/Screenshot)' : 'Foto/Screenshot Bukti Transfer'}
                                            <span className="text-rose-500 ml-0.5">*</span>
                                        </label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border/70 hover:border-[#4A070B]/40 dark:hover:border-[#E8D0BA]/30 rounded-xl p-5 cursor-pointer transition group"
                                        >
                                            {filePreview ? (
                                                <img src={filePreview} alt="Preview" className="max-h-36 rounded-lg object-contain" />
                                            ) : (
                                                <>
                                                    <Upload className="w-7 h-7 text-muted-foreground group-hover:text-foreground transition" />
                                                    <p className="text-xs text-muted-foreground group-hover:text-foreground transition text-center">
                                                        {selectedFile
                                                            ? selectedFile.name
                                                            : (isEn ? 'Click to select image or PDF (max 5MB)' : 'Klik untuk pilih gambar atau PDF (maks 5MB)')}
                                                    </p>
                                                </>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,.pdf"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        {manualForm.errors.payment_proof && (
                                            <p className="text-xs text-rose-500 mt-1">{manualForm.errors.payment_proof}</p>
                                        )}
                                    </div>

                                    {/* Notes (Optional) */}
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground mb-1">
                                            {isEn ? 'Notes (optional)' : 'Catatan (opsional)'}
                                        </label>
                                        <textarea
                                            value={manualForm.data.payment_notes}
                                            onChange={(e) => manualForm.setData('payment_notes', e.target.value)}
                                            placeholder={isEn ? 'e.g. Transferred from BCA Mobile at 10:30' : 'mis. Transfer dari BCA Mobile pukul 10.30'}
                                            rows={2}
                                            className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4A070B]/30 dark:focus:ring-[#E8D0BA]/30 resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={manualForm.processing || !manualForm.data.payment_sender_name || !manualForm.data.payment_proof}
                                        className="w-full h-11 rounded-lg font-bold text-sm bg-[#4A070B] hover:bg-[#3a050a] text-white shadow-none cursor-pointer transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {manualForm.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {isWaitingConfirmation
                                            ? (isEn ? 'Update Transfer Proof' : 'Perbarui Bukti Transfer')
                                            : (isEn ? 'Submit Transfer Proof' : 'Kirim Bukti Transfer')}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* Bottom action buttons: Cek Status Bayar & Belanja Lagi */}
                        {checkMessage && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center">
                                {checkMessage}
                            </p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCheckStatus}
                                disabled={isChecking}
                                className="h-11 rounded-md font-bold text-xs sm:text-sm text-foreground border-border/80 hover:bg-muted/50 cursor-pointer shadow-none flex items-center justify-center gap-1.5"
                            >
                                {isChecking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                <span>{isChecking ? (isEn ? 'Checking...' : 'Mengecek...') : (isEn ? 'Check Status' : 'Cek Status Bayar')}</span>
                            </Button>
                            <Link href="/products" className="block w-full">
                                <Button
                                    type="button"
                                    className="w-full h-11 rounded-md font-bold text-xs sm:text-sm bg-[#FFC400] hover:bg-[#E5B000] text-black shadow-none cursor-pointer transition active:scale-[0.98]"
                                >
                                    {isEn ? 'Shop Again' : 'Belanja Lagi'}
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* ======================================================== */
                    /* PENDING STATE: INSTRUKSI PEMBAYARAN (GATEWAY / OTOMATIS) */
                    /* ======================================================== */
                    <div className="w-full max-w-[520px] mx-auto space-y-4">

                        {/* 1. 24-Hour Countdown Timer Card (Consistent with manual payment) */}
                        <div className="bg-card/60 backdrop-blur-xs border border-border/80 rounded-2xl p-4 sm:p-5 text-center space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>{isEn ? 'Payment deadline (24 hours from order)' : 'Batas waktu bayar (24 jam sejak pesan)'}</span>
                            </div>
                            <div className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${timeLeft < 3600 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                                {hours} {isEn ? 'hrs' : 'jam'} : {minutes} {isEn ? 'min' : 'menit'} : {seconds} {isEn ? 'sec' : 'detik'}
                            </div>
                            {checkMessage && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium pt-1">
                                    {checkMessage}
                                </p>
                            )}
                        </div>

                        {/* 2. QRIS Display Card (If QRIS payment) */}
                        {isQris && (
                            <div className="bg-card/70 backdrop-blur-xs border border-border/80 rounded-2xl p-6 sm:p-7 shadow-none text-center space-y-4">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
                                        <span>{isEn ? 'Aroma Palace Official QRIS' : 'QRIS Resmi Aroma Palace'}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {isEn ? 'Scan using BCA Mobile, Livin, GoPay, OVO, Dana, ShopeePay' : 'Scan dengan BCA Mobile, Livin, GoPay, OVO, Dana, ShopeePay'}
                                    </p>
                                </div>

                                <div className="p-4 bg-white rounded-xl border border-neutral-200 inline-block shadow-sm">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(order.payment_code)}`}
                                        alt={`QRIS Aroma Palace #${order.order_number}`}
                                        className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto"
                                    />
                                </div>

                                <div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(order.payment_code, 'code')}
                                        className="rounded-md border border-border/80 hover:bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition cursor-pointer select-none"
                                    >
                                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                        <span>{copiedCode ? (isEn ? 'Code Copied' : 'Kode Tersalin') : (isEn ? 'Copy QRIS Code' : 'Salin Kode QRIS')}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3. Payment Details Card (Matching Manual Bank Details Card) */}
                        <div className="bg-card/70 backdrop-blur-xs border border-border/80 rounded-2xl p-6 sm:p-7 shadow-none space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                                    <h2 className="text-sm font-bold text-foreground">
                                        {isPaymentLink
                                            ? (isEn ? 'Payment Link Details' : 'Rincian Pembayaran')
                                            : isQris
                                            ? (isEn ? 'QRIS Payment Details' : 'Rincian Pembayaran QRIS')
                                            : (isEn ? 'Virtual Account Details' : 'Rincian Virtual Account')}
                                    </h2>
                                </div>
                                <div>
                                    {renderPaymentLogo()}
                                </div>
                            </div>

                            {/* Rounded inner container */}
                            <div className="bg-muted/40 rounded-xl p-4 border border-border/60 space-y-3">
                                {/* Row: Method */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{isEn ? 'Payment Method' : 'Metode Pembayaran'}</span>
                                    <span className="font-extrabold text-sm text-foreground">{methodDisplayName}</span>
                                </div>
                                <div className="border-t border-border/60" />

                                {/* Row: Payment Code / VA (if not QRIS) */}
                                {!isQris && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-xs text-muted-foreground block">
                                                    {isPaymentLink
                                                        ? (isEn ? 'Payment Code' : 'Kode Pembayaran')
                                                        : (isEn ? 'Virtual Account Number' : 'Nomor Virtual Account')}
                                                </span>
                                                <span className="font-black text-base text-foreground font-mono tracking-wider mt-0.5 block">
                                                    {order.payment_code}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(order.payment_code, 'code')}
                                                className="rounded-md border border-border/80 hover:bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground flex items-center gap-1.5 transition cursor-pointer select-none"
                                            >
                                                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                                <span>{copiedCode ? (isEn ? 'Copied' : 'Tersalin') : (isEn ? 'Copy' : 'Salin')}</span>
                                            </button>
                                        </div>
                                        <div className="border-t border-border/60" />
                                    </>
                                )}

                                {/* Row: Total Amount */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{isEn ? 'Total Payment' : 'Jumlah Pembayaran'}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-base text-[#4A070B] dark:text-[#E8D0BA]">
                                            {order.total_amount_formatted}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(String(order.total_amount), 'amount')}
                                            className="rounded-md border border-border/80 hover:bg-muted/60 px-2 py-1 text-xs font-semibold text-foreground flex items-center gap-1 transition cursor-pointer select-none"
                                        >
                                            {copiedAmount ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Direct payment link button if link */}
                            {isPaymentLink && (
                                <a
                                    href={order.payment_code}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#4A070B] to-[#7A1C22] text-white font-bold text-xs sm:text-sm hover:opacity-95 transition shadow-xs"
                                >
                                    <span>{isEn ? 'Open Payment Page' : 'Buka Halaman Pembayaran'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            )}
                        </div>

                        {/* 4. Cara Pembayaran Accordion Card (Consistent with manual payment) */}
                        <div className="bg-card/70 backdrop-blur-xs border border-border/80 rounded-2xl p-5 sm:p-6 shadow-none">
                            <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide">
                                {isEn ? 'Payment Instructions' : 'Cara Pembayaran'}
                            </p>
                            <div className="divide-y divide-border/60">
                                {isQris ? (
                                    <>
                                        {/* QRIS: E-Wallet */}
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenAccordion(openAccordion === 'qris_app' ? null : 'qris_app')}
                                                className="w-full py-3 flex items-center justify-between text-left font-semibold text-sm text-foreground hover:text-foreground/80 transition cursor-pointer"
                                            >
                                                <span>{isEn ? 'E-Wallet Apps (GoPay, OVO, DANA, ShopeePay)' : 'Aplikasi E-Wallet (GoPay, OVO, DANA, ShopeePay)'}</span>
                                                <svg
                                                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openAccordion === 'qris_app' ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {openAccordion === 'qris_app' && (
                                                <ol className="list-decimal list-inside text-[11.5px] text-muted-foreground space-y-1.5 pb-3 pl-1 leading-relaxed">
                                                    {isEn ? (
                                                        <>
                                                            <li>Open your preferred e-wallet application (GoPay, OVO, DANA, ShopeePay).</li>
                                                            <li>Select the <strong>Scan QR / Pay</strong> menu.</li>
                                                            <li>Point your camera at the QRIS code displayed above (or select from gallery if using screenshot).</li>
                                                            <li>Confirm that the merchant is <strong>Aroma Palace</strong> and the amount matches <strong className="text-foreground">{order.total_amount_formatted}</strong>.</li>
                                                            <li>Enter your security PIN. Your payment will be verified automatically in real-time.</li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li>Buka aplikasi e-wallet pilihan Anda (GoPay, OVO, DANA, ShopeePay).</li>
                                                            <li>Pilih menu <strong>Scan / Bayar</strong>.</li>
                                                            <li>Arahkan kamera ke kode QRIS di atas (atau pilih dari galeri jika menggunakan screenshot).</li>
                                                            <li>Pastikan nama merchant tertera <strong>Aroma Palace</strong> dan nominal tepat <strong className="text-foreground">{order.total_amount_formatted}</strong>.</li>
                                                            <li>Masukkan PIN keamanan Anda. Pembayaran akan diverifikasi secara otomatis seketika tanpa perlu upload bukti transfer.</li>
                                                        </>
                                                    )}
                                                </ol>
                                            )}
                                        </div>

                                        {/* QRIS: Mobile Banking */}
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenAccordion(openAccordion === 'qris_mbanking' ? null : 'qris_mbanking')}
                                                className="w-full py-3 flex items-center justify-between text-left font-semibold text-sm text-foreground hover:text-foreground/80 transition cursor-pointer"
                                            >
                                                <span>{isEn ? 'Mobile Banking QRIS (BCA Mobile, Livin, BRImo, BNI)' : 'Mobile Banking QRIS (BCA Mobile, Livin, BRImo, BNI)'}</span>
                                                <svg
                                                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openAccordion === 'qris_mbanking' ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {openAccordion === 'qris_mbanking' && (
                                                <ol className="list-decimal list-inside text-[11.5px] text-muted-foreground space-y-1.5 pb-3 pl-1 leading-relaxed">
                                                    {isEn ? (
                                                        <>
                                                            <li>Open your Mobile Banking app and log in.</li>
                                                            <li>Tap the <strong>QRIS</strong> icon on the bottom or main dashboard.</li>
                                                            <li>Scan the QRIS code displayed above.</li>
                                                            <li>Verify recipient name <strong>Aroma Palace</strong> and total amount (<strong className="text-foreground">{order.total_amount_formatted}</strong>).</li>
                                                            <li>Enter your m-Banking transaction PIN to complete payment.</li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li>Buka aplikasi Mobile Banking bank Anda dan login.</li>
                                                            <li>Pilih menu atau ikon <strong>QRIS</strong> pada layar utama aplikasi.</li>
                                                            <li>Pindai kode QRIS di atas.</li>
                                                            <li>Periksa nama penerima <strong>Aroma Palace</strong> dan total tagihan (<strong className="text-foreground">{order.total_amount_formatted}</strong>).</li>
                                                            <li>Masukkan PIN transaksi m-Banking Anda untuk menyelesaikan pembayaran secara otomatis.</li>
                                                        </>
                                                    )}
                                                </ol>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* VA: ATM */}
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenAccordion(openAccordion === 'atm' ? null : 'atm')}
                                                className="w-full py-3 flex items-center justify-between text-left font-semibold text-sm text-foreground hover:text-foreground/80 transition cursor-pointer"
                                            >
                                                <span>ATM {order.payment_channel || (order.payment_method?.replace('_va', '').toUpperCase()) || 'Bank'}</span>
                                                <svg
                                                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openAccordion === 'atm' ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {openAccordion === 'atm' && (
                                                <ol className="list-decimal list-inside text-[11.5px] text-muted-foreground space-y-1.5 pb-3 pl-1 leading-relaxed">
                                                    {isEn ? (
                                                        <>
                                                            <li>Insert your ATM card and enter your PIN.</li>
                                                            <li>Select <strong>Other Transactions</strong> &gt; <strong>Transfer</strong> &gt; <strong>To Virtual Account</strong>.</li>
                                                            <li>Enter Virtual Account number: <strong className="text-foreground font-mono">{order.payment_code}</strong>, then select Correct.</li>
                                                            <li>Verify payment details (Merchant: <strong>Aroma Palace</strong>, Amount: <strong className="text-foreground">{order.total_amount_formatted}</strong>).</li>
                                                            <li>Press <strong>Yes</strong> to complete transaction. Your order will be updated automatically.</li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li>Masukkan kartu ATM dan PIN Anda di mesin ATM.</li>
                                                            <li>Pilih menu <strong>Transaksi Lainnya</strong> &gt; <strong>Transfer</strong> &gt; <strong>Ke Rekening Virtual Account</strong>.</li>
                                                            <li>Masukkan nomor Virtual Account: <strong className="text-foreground font-mono">{order.payment_code}</strong> lalu pilih Benar.</li>
                                                            <li>Periksa rincian pembayaran (Nama: <strong>Aroma Palace</strong>, Total: <strong className="text-foreground">{order.total_amount_formatted}</strong>).</li>
                                                            <li>Pilih <strong>Ya</strong> untuk memproses pembayaran. Transaksi selesai dan status pesanan otomatis terverifikasi.</li>
                                                        </>
                                                    )}
                                                </ol>
                                            )}
                                        </div>

                                        {/* VA: Mobile Banking */}
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenAccordion(openAccordion === 'mbanking' ? null : 'mbanking')}
                                                className="w-full py-3 flex items-center justify-between text-left font-semibold text-sm text-foreground hover:text-foreground/80 transition cursor-pointer"
                                            >
                                                <span>Mobile Banking {order.payment_channel || (order.payment_method?.replace('_va', '').toUpperCase()) || ''}</span>
                                                <svg
                                                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openAccordion === 'mbanking' ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {openAccordion === 'mbanking' && (
                                                <ol className="list-decimal list-inside text-[11.5px] text-muted-foreground space-y-1.5 pb-3 pl-1 leading-relaxed">
                                                    {isEn ? (
                                                        <>
                                                            <li>Open your Mobile Banking app and log in.</li>
                                                            <li>Select menu <strong>Transfer / Payment</strong> &gt; <strong>Virtual Account</strong>.</li>
                                                            <li>Enter Virtual Account number: <strong className="text-foreground font-mono">{order.payment_code}</strong>.</li>
                                                            <li>Confirm that the total amount is <strong className="text-foreground">{order.total_amount_formatted}</strong> for <strong>Aroma Palace</strong>.</li>
                                                            <li>Enter your Mobile Banking PIN to confirm. Payment is verified automatically in real-time.</li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li>Buka aplikasi Mobile Banking Anda dan lakukan login.</li>
                                                            <li>Pilih menu <strong>Transfer</strong> atau <strong>Pembayaran</strong> &gt; <strong>Virtual Account</strong>.</li>
                                                            <li>Masukkan nomor Virtual Account: <strong className="text-foreground font-mono">{order.payment_code}</strong>.</li>
                                                            <li>Pastikan jumlah tagihan sesuai sebesar <strong className="text-foreground">{order.total_amount_formatted}</strong> atas nama <strong>Aroma Palace</strong>.</li>
                                                            <li>Masukkan PIN transaksi Mobile Banking Anda. Pembayaran lunas seketika tanpa perlu kirim bukti transfer.</li>
                                                        </>
                                                    )}
                                                </ol>
                                            )}
                                        </div>

                                        {/* VA: Internet Banking */}
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenAccordion(openAccordion === 'ibanking' ? null : 'ibanking')}
                                                className="w-full py-3 flex items-center justify-between text-left font-semibold text-sm text-foreground hover:text-foreground/80 transition cursor-pointer"
                                            >
                                                <span>Internet Banking</span>
                                                <svg
                                                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openAccordion === 'ibanking' ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {openAccordion === 'ibanking' && (
                                                <ol className="list-decimal list-inside text-[11.5px] text-muted-foreground space-y-1.5 pb-3 pl-1 leading-relaxed">
                                                    {isEn ? (
                                                        <>
                                                            <li>Log in to your bank's Internet Banking portal.</li>
                                                            <li>Navigate to <strong>Transfer / Payment</strong> &gt; <strong>Virtual Account</strong>.</li>
                                                            <li>Enter Virtual Account number: <strong className="text-foreground font-mono">{order.payment_code}</strong>.</li>
                                                            <li>Verify billing information and enter your security token response / OTP.</li>
                                                            <li>Payment is complete and will be processed immediately.</li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li>Masuk ke layanan Internet Banking bank Anda.</li>
                                                            <li>Pilih menu <strong>Pembayaran / Transfer</strong> &gt; <strong>Virtual Account</strong>.</li>
                                                            <li>Masukkan nomor Virtual Account: <strong className="text-foreground font-mono">{order.payment_code}</strong>.</li>
                                                            <li>Periksa rincian tagihan ({order.total_amount_formatted}) lalu masukkan kode otentikasi/token PIN Anda.</li>
                                                            <li>Transaksi selesai dan status pembayaran otomatis terverifikasi lunas.</li>
                                                        </>
                                                    )}
                                                </ol>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 5. Bottom Action Buttons: Check Status & Shop Again */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCheckStatus}
                                disabled={isChecking}
                                className="h-11 rounded-md font-bold text-xs sm:text-sm text-foreground border-border/80 hover:bg-muted/50 cursor-pointer shadow-none flex items-center justify-center gap-1.5"
                            >
                                {isChecking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                <span>{isChecking ? (isEn ? 'Checking...' : 'Mengecek...') : (isEn ? 'Check Status' : 'Cek Status Bayar')}</span>
                            </Button>
                            <Link href="/products" className="block w-full">
                                <Button
                                    type="button"
                                    className="w-full h-11 rounded-md font-bold text-xs sm:text-sm bg-[#FFC400] hover:bg-[#E5B000] text-black shadow-none cursor-pointer transition active:scale-[0.98]"
                                >
                                    {isEn ? 'Shop Again' : 'Belanja Lagi'}
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default function PaymentPage({ order }: { order?: PaymentProps['order'] }) {
    const { isEn } = useTranslation();

    if (!order) {
        return (
            <Layout>
                <Head title={isEn ? 'Preparing Payment • Aroma Palace' : 'Menyiapkan Pembayaran • Aroma Palace'} />
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full border-3 border-[#4A070B]/20 border-t-[#4A070B] dark:border-[#E8D0BA]/20 dark:border-t-[#E8D0BA] animate-spin mb-4" />
                    <h2 className="text-lg font-bold text-foreground">
                        {isEn ? 'Preparing Payment Transaction...' : 'Menyiapkan Transaksi Pembayaran...'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        {isEn ? 'Connecting to Aroma Palace secure payment server.' : 'Sedang menghubungkan ke server pembayaran aman Aroma Palace.'}
                    </p>
                </div>
            </Layout>
        );
    }

    return <PaymentContent order={order} />;
}
