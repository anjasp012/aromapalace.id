import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';

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
        total_amount: number;
        total_amount_formatted: string;
    };
}

function PaymentContent({ order }: PaymentProps) {
    const isPaid = order.payment_status === 'paid' || order.status === 'menunggu_konfirmasi' || order.status === 'diproses';
    const isQris = order.payment_method === 'qris';
    const isPaymentLink = order.payment_method === 'payment_link' || order.payment_code?.startsWith('http');

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
    const [openAccordion, setOpenAccordion] = useState<string | null>(isQris ? 'qris_app' : 'atm');
    const [isChecking, setIsChecking] = useState(false);
    const [checkMessage, setCheckMessage] = useState<string | null>(null);

    // Countdown tick
    useEffect(() => {
        if (isPaid) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [isPaid]);

    // Auto-polling status check every 15 seconds while pending
    useEffect(() => {
        if (isPaid) return;

        const pollTimer = setInterval(() => {
            router.reload({
                only: ['order'],
            });
        }, 15000);

        return () => clearInterval(pollTimer);
    }, [order.order_number, isPaid]);

    const hours = String(Math.floor(timeLeft / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0');
    const seconds = String(timeLeft % 60).padStart(2, '0');

    const handleCopy = (text: string, type: 'code' | 'amount') => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(text);
        }
        if (type === 'code') {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } else {
            setCopiedAmount(true);
            setTimeout(() => setCopiedAmount(false), 2000);
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
                        setCheckMessage('Pembayaran terkonfirmasi lunas!');
                    } else {
                        setCheckMessage('Pembayaran belum diterima. Silakan selesaikan transaksi.');
                        setTimeout(() => setCheckMessage(null), 4000);
                    }
                },
            }
        );
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
        ? 'QRIS Realtime'
        : order.payment_method?.includes('va')
        ? order.payment_channel || 'Virtual Account'
        : order.payment_channel || 'Transfer Bank';

    return (
        <Layout>
            <Head title={`Selesaikan Pembayaran #${order.order_number} • Aroma Palace`} />

            {/* PAGE HEADER BANNER (Consistent with cart.tsx & checkout.tsx) */}
            <div className="border-b border-border/70 bg-gradient-to-b from-muted/30 via-background to-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        {isPaid ? (
                            <>
                                <span className="font-light">Konfirmasi</span>{' '}
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">Pembayaran</span>
                            </>
                        ) : (
                            <>
                                <span className="font-light">Selesaikan</span>{' '}
                                <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">Pembayaran</span>
                            </>
                        )}
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {isPaid
                            ? `Pesanan wewangian nomor #${order.order_number} telah berhasil dikonfirmasi lunas.`
                            : `Lakukan pembayaran sesuai batas waktu yang ditentukan untuk menyelesaikan pesanan #${order.order_number}.`}
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
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <div className="space-y-2">
                            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                Pembayaran Lunas
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                Terima Kasih Atas Pembayaran Anda
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Transaksi pesanan <strong className="text-foreground">#{order.order_number}</strong> telah berhasil diverifikasi lunas. Kurator kami sedang menyiapkan wewangian mewah pesanan Anda.
                            </p>
                        </div>

                        <div className="bg-muted/40 rounded-xl p-4 border border-border/80 text-xs space-y-2.5 text-left">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Nomor Pesanan:</span>
                                <span className="font-bold text-foreground">{order.order_number}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Total Pembayaran:</span>
                                <span className="font-extrabold text-foreground">{order.total_amount_formatted}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Metode Pembayaran:</span>
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
                                    Riwayat Pesanan
                                </Button>
                            </Link>
                            <Link href="/products" className="block w-full">
                                <Button
                                    type="button"
                                    className="w-full h-11 rounded-md font-bold text-xs sm:text-sm bg-[#FFC400] hover:bg-[#E5B000] text-black shadow-none cursor-pointer transition active:scale-[0.98]"
                                >
                                    Belanja Lagi
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* ======================================================== */
                    /* PENDING STATE: INSTRUKSI PEMBAYARAN */
                    /* ======================================================== */
                    <div className="w-full max-w-[480px] mx-auto bg-card/60 backdrop-blur-xs border border-border/80 rounded-2xl p-6 sm:p-8 shadow-none space-y-5">
                        
                        {/* Header: Countdown Timer */}
                        <div className="text-center space-y-1">
                            <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                                Selesaikan pembayaran dalam
                            </p>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                {hours} jam : {minutes} menit : {seconds} detik
                            </h2>
                        </div>

                        {/* Status feedback message if any */}
                        {checkMessage && (
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 text-center font-medium">
                                {checkMessage}
                            </div>
                        )}

                        {/* QRIS DISPLAY BOX (If QRIS payment) */}
                        {isQris && (
                            <div className="bg-white dark:bg-neutral-900 border border-border/80 rounded-xl p-4 sm:p-5 text-center space-y-3.5 shadow-xs">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                                        <span>QRIS Resmi Aroma Palace</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Scan dengan BCA Mobile, Livin, GoPay, OVO, Dana, ShopeePay
                                    </p>
                                </div>

                                <div className="p-3 bg-white rounded-lg border border-neutral-200 inline-block shadow-inner">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(order.payment_code)}`}
                                        alt={`QRIS Aroma Palace #${order.order_number}`}
                                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain mx-auto"
                                    />
                                </div>

                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(order.payment_code, 'code')}
                                        className="rounded-md border border-border/80 hover:bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground flex items-center gap-1.5 transition cursor-pointer select-none"
                                    >
                                        <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                        </svg>
                                        <span>{copiedCode ? 'Kode Tersalin' : 'Salin Kode QRIS'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Details Table */}
                        <div className="space-y-4 pt-1">
                            {/* Row 1: Metode Pembayaran */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-muted-foreground block">
                                        Metode Pembayaran
                                    </span>
                                    <span className="font-extrabold text-sm sm:text-base text-foreground block mt-0.5">
                                        {methodDisplayName}
                                    </span>
                                </div>
                                <div>
                                    {renderPaymentLogo()}
                                </div>
                            </div>

                            {/* Row 2: Nomor Virtual Account / Kode Bayar (jika bukan QRIS) */}
                            {!isQris && (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">
                                            {isPaymentLink ? 'Kode Pembayaran' : 'Nomor Virtual Account'}
                                        </span>
                                        <span className="font-extrabold text-sm sm:text-base tracking-wide text-foreground block mt-0.5 font-mono">
                                            {order.payment_code}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(order.payment_code, 'code')}
                                        className="rounded-md border border-border/80 hover:bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground flex items-center gap-1.5 transition cursor-pointer select-none"
                                    >
                                        <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                        </svg>
                                        <span>{copiedCode ? 'Tersalin' : 'Salin'}</span>
                                    </button>
                                </div>
                            )}

                            {/* Row 3: Total Pembayaran */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-muted-foreground block">
                                        Total Pembayaran
                                    </span>
                                    <span className="font-extrabold text-sm sm:text-base text-foreground block mt-0.5">
                                        {order.total_amount_formatted}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(String(order.total_amount), 'amount')}
                                    className="rounded-md border border-border/80 hover:bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground flex items-center gap-1.5 transition cursor-pointer select-none"
                                >
                                    <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                    </svg>
                                    <span>{copiedAmount ? 'Tersalin' : 'Salin'}</span>
                                </button>
                            </div>
                        </div>

                        {/* DIRECT PAYMENT LINK BUTTON (If link) */}
                        {isPaymentLink && (
                            <a
                                href={order.payment_code}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#4A070B] to-[#7A1C22] text-white font-bold text-xs sm:text-sm hover:opacity-95 transition shadow-xs"
                            >
                                <span>Buka Halaman Pembayaran</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        )}

                        {/* Action Buttons: 2 Columns */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCheckStatus}
                                disabled={isChecking}
                                className="h-11 rounded-md font-bold text-xs sm:text-sm text-foreground border-border/80 hover:bg-muted/50 cursor-pointer shadow-none"
                            >
                                {isChecking ? 'Mengecek...' : 'Cek Status Bayar'}
                            </Button>
                            <Link href="/products" className="block w-full">
                                <Button
                                    type="button"
                                    className="w-full h-11 rounded-md font-bold text-xs sm:text-sm bg-[#FFC400] hover:bg-[#E5B000] text-black shadow-none cursor-pointer transition active:scale-[0.98]"
                                >
                                    Belanja Lagi
                                </Button>
                            </Link>
                        </div>

                        {/* Direct Navigation to Orders */}
                        <div className="pt-1 text-center">
                            <Link
                                href="/account/orders"
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition underline underline-offset-4 py-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span>Lihat Semua Transaksi &amp; Pesanan Saya</span>
                            </Link>
                        </div>

                        {/* Cara Pembayaran Section */}
                        <div className="pt-2 space-y-1">
                            <h3 className="font-bold text-xs sm:text-sm text-foreground mb-2">
                                Cara Pembayaran
                            </h3>

                            {/* Accordion List */}
                            <div className="border-t border-border/80 divide-y divide-border/80 text-xs">
                                {isQris ? (
                                    <>
                                        {/* QRIS: E-Wallet */}
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenAccordion(openAccordion === 'qris_app' ? null : 'qris_app')}
                                                className="w-full py-3 flex items-center justify-between text-left font-medium text-foreground hover:text-foreground/80 transition cursor-pointer"
                                            >
                                                <span>Aplikasi E-Wallet (GoPay, OVO, Dana, ShopeePay)</span>
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
                                                    <li>Buka aplikasi GoPay, OVO, Dana, atau ShopeePay di smartphone Anda.</li>
                                                    <li>Pilih fitur <strong>Scan / Bayar via QRIS</strong>.</li>
                                                    <li>Arahkan kamera ke kode QR di atas (atau unggah tangkapan layar kode QR).</li>
                                                    <li>Periksa nama toko <strong>Aroma Palace</strong> dan jumlah bayar (<strong className="text-foreground">{order.total_amount_formatted}</strong>).</li>
                                                    <li>Konfirmasi pembayaran dan masukkan PIN Anda. Pembayaran akan terkonfirmasi secara instan.</li>
                                                </ol>
                                            )}
                                        </div>

                                        {/* QRIS: Mobile Banking */}
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenAccordion(openAccordion === 'qris_mbanking' ? null : 'qris_mbanking')}
                                                className="w-full py-3 flex items-center justify-between text-left font-medium text-foreground hover:text-foreground/80 transition cursor-pointer"
                                            >
                                                <span>Mobile Banking (BCA Mobile, Livin, BRImo, BNI)</span>
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
                                                    <li>Buka aplikasi m-Banking bank pilihan Anda.</li>
                                                    <li>Tekan tombol logo <strong>QRIS</strong> di layar utama.</li>
                                                    <li>Pindai kode QR yang tampil di atas.</li>
                                                    <li>Pastikan rincian tagihan sudah sesuai, lalu masukkan PIN m-Banking Anda.</li>
                                                </ol>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Accordion 1: ATM */}
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenAccordion(openAccordion === 'atm' ? null : 'atm')}
                                                className="w-full py-3 flex items-center justify-between text-left font-medium text-foreground hover:text-foreground/80 transition cursor-pointer"
                                            >
                                                <span>ATM {order.payment_method?.replace('_va', '').toUpperCase() || 'Bank'}</span>
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
                                                    <li>Masukkan kartu ATM dan PIN Anda.</li>
                                                    <li>Pilih menu <strong>Transaksi Lainnya</strong> &gt; <strong>Transfer</strong> &gt; <strong>Ke Rekening Virtual Account</strong>.</li>
                                                    <li>Masukkan nomor Virtual Account: <strong className="text-foreground font-mono">{order.payment_code}</strong> lalu tekan Benar.</li>
                                                    <li>Pastikan rincian tagihan (<strong className="text-foreground">{order.total_amount_formatted}</strong>) sudah benar, lalu selesaikan pembayaran.</li>
                                                </ol>
                                            )}
                                        </div>

                                        {/* Accordion 2: M-Banking */}
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenAccordion(openAccordion === 'mbanking' ? null : 'mbanking')}
                                                className="w-full py-3 flex items-center justify-between text-left font-medium text-foreground hover:text-foreground/80 transition cursor-pointer"
                                            >
                                                <span>Mobile Banking {order.payment_method?.replace('_va', '').toUpperCase() || ''}</span>
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
                                                    <li>Buka aplikasi Mobile Banking dan masuk ke akun Anda.</li>
                                                    <li>Pilih menu <strong>Transfer / Pembayaran</strong> &gt; <strong>Virtual Account</strong>.</li>
                                                    <li>Masukkan nomor Virtual Account: <strong className="text-foreground font-mono">{order.payment_code}</strong>.</li>
                                                    <li>Periksa nama pemesan &amp; jumlah bayar (<strong className="text-foreground">{order.total_amount_formatted}</strong>), lalu masukkan PIN transaksi Anda.</li>
                                                </ol>
                                            )}
                                        </div>

                                        {/* Accordion 3: Internet Banking */}
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenAccordion(openAccordion === 'ibanking' ? null : 'ibanking')}
                                                className="w-full py-3 flex items-center justify-between text-left font-medium text-foreground hover:text-foreground/80 transition cursor-pointer"
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
                                                    <li>Login ke layanan Internet Banking Anda.</li>
                                                    <li>Pilih menu <strong>Transfer Dana</strong> &gt; <strong>Transfer ke Virtual Account</strong>.</li>
                                                    <li>Ketikkan nomor Virtual Account: <strong className="text-foreground font-mono">{order.payment_code}</strong>.</li>
                                                    <li>Verifikasi nominal tagihan dan masukkan token/PIN otentikasi untuk konfirmasi pembayaran.</li>
                                                </ol>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </Layout>
    );
}

export default function PaymentPage({ order }: { order?: PaymentProps['order'] }) {
    if (!order) {
        return (
            <Layout>
                <Head title="Menyiapkan Pembayaran • Aroma Palace" />
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full border-3 border-[#4A070B]/20 border-t-[#4A070B] dark:border-[#E8D0BA]/20 dark:border-t-[#E8D0BA] animate-spin mb-4" />
                    <h2 className="text-lg font-bold text-foreground">Menyiapkan Transaksi Pembayaran...</h2>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Sedang menghubungkan ke server pembayaran aman Aroma Palace.
                    </p>
                </div>
            </Layout>
        );
    }

    return <PaymentContent order={order} />;
}
