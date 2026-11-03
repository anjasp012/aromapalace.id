@extends('emails.layout')

@section('content')
    <div class="greeting">Pembayaran Berhasil Dikonfirmasi!</div>

    <p>Kabar gembira, <strong>{{ $order->recipient_name }}</strong>! Pembayaran untuk pesanan Anda telah kami terima secara penuh dan saat ini pesanan sedang diproses.</p>

    <div class="card-box" style="text-align: center; background-color: #f0fdf4; border-color: #bbf7d0;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; font-weight: 700;">Status Pembayaran: LUNAS</span>
        <div style="font-size: 20px; font-weight: 800; color: #14532d; margin: 4px 0; font-family: monospace;">#{{ $order->order_number }}</div>
        <div style="font-size: 12px; color: #4b5563;">Jumlah Terbayar: <strong style="color: #15803d;">Rp {{ number_format($order->total_amount, 0, ',', '.') }}</strong></div>
    </div>

    <p>Tim kurator parfum Aroma Palace sedang mempersiapkan, mengemas dengan segel eksklusif, dan memastikan botol wewangian Anda terlindungi secara sempurna sebelum diserahkan ke pihak ekspedisi.</p>

    <div style="margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #171717; margin-bottom: 8px;">Daftar Produk:</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            @foreach ($order->items as $item)
                <tr style="border-bottom: 1px solid #f0ebe4;">
                    <td style="padding: 8px 0;">
                        <strong>{{ $item->product_name ?: ($item->product?->name ?? 'Parfum Mahakarya') }}</strong>
                        @if ($item->volume)
                            <span style="color: #737373;">({{ $item->volume }}ml)</span>
                        @endif
                        <br>
                        <span style="color: #737373;">Jumlah: {{ $item->quantity }}</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 700; vertical-align: top;">
                        Rp {{ number_format($item->subtotal ?: ($item->price * $item->quantity), 0, ',', '.') }}
                    </td>
                </tr>
            @endforeach
        </table>
    </div>

    {{-- DOKUMEN INVOICE RESMI --}}
    <div class="card-box" style="background-color: #faf7f4; border-left: 4px solid #4A070B; margin: 24px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #4A070B; margin-bottom: 4px;">
            📄 Dokumen Faktur / Invoice Resmi
        </div>
        <p style="font-size: 12px; color: #525252; margin: 0 0 10px; line-height: 1.5;">
            @if (!empty($hasPdfAttachment))
                Faktur resmi pesanan Anda telah <strong>dilampirkan dalam format PDF</strong> (<code>Invoice-{{ $order->order_number }}.pdf</code>) pada email ini sebagai bukti transaksi yang sah.
            @else
                Faktur resmi pesanan Anda siap diunduh atau dilihat secara online melalui akun Anda.
            @endif
        </p>
        <div style="font-size: 12px;">
            <a href="{{ $invoiceDownloadUrl ?? url('/orders/' . $order->order_number . '/invoice/download') }}" style="display: inline-block; background-color: #4A070B; color: #E8D0BA !important; text-decoration: none; padding: 7px 16px; border-radius: 6px; font-weight: 700; font-size: 11px; margin-right: 8px;">Unduh Invoice PDF</a>
            <a href="{{ $invoiceUrl ?? url('/orders/' . $order->order_number . '/invoice') }}" style="color: #4A070B; font-weight: 600; text-decoration: underline; font-size: 11px;">Lihat Faktur di Web</a>
        </div>
    </div>

    <div class="btn-wrapper">
        <a href="{{ url('/account/orders') }}" class="btn">Pantau Pesanan Anda</a>
    </div>

    <div class="security-note">
        Kami akan segera mengirimkan email pemberitahuan beserta nomor resi pelacakan saat paket parfum Anda mulai dikirim oleh kurir.
    </div>
@endsection
