@extends('emails.layout')

@section('content')
    <div class="greeting">Pesanan Anda Berhasil Dibuat!</div>

    <p>Terima kasih telah berbelanja di Aroma Palace, <strong>{{ $order->recipient_name }}</strong>. Pesanan Anda telah tercatat dalam sistem kami dengan nomor pesanan:</p>

    <div class="card-box" style="text-align: center; background-color: #faf4ed; border-color: #E8D0BA;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8C1D24; font-weight: 700;">Nomor Pesanan</span>
        <div style="font-size: 20px; font-weight: 800; color: #4A070B; margin: 4px 0; font-family: monospace;">#{{ $order->order_number }}</div>
        <div style="font-size: 12px; color: #737373;">Total Tagihan: <strong style="color: #171717;">Rp {{ number_format($order->total_amount, 0, ',', '.') }}</strong></div>
        @if ($order->unique_code)
            <div style="margin-top: 6px; font-size: 11px; color: #b45309; background: #fffbeb; padding: 4px 8px; border-radius: 4px; display: inline-block; font-weight: 600;">
                Termasuk Kode Unik Pembayaran: +Rp {{ number_format($order->unique_code, 0, ',', '.') }}
            </div>
        @endif
    </div>

    @if ($order->payment_code && $order->status === 'menunggu_pembayaran')
        <div class="card-box" style="border-left: 4px solid #4A070B;">
            <div style="font-size: 12px; font-weight: 700; color: #4A070B; text-transform: uppercase;">Instruksi Pembayaran</div>
            <div style="font-size: 13px; margin-top: 4px;">
                Metode: <strong>{{ $order->payment_channel ?: $order->payment_method }}</strong><br>
                Nomor Rekening / Kode Pembayaran:<br>
                <span style="display: inline-block; font-size: 18px; font-weight: 800; font-family: monospace; background: #fff; padding: 6px 12px; border: 1px dashed #d4d4d4; border-radius: 6px; margin-top: 4px; color: #171717;">
                    {{ $order->payment_code }}
                </span>
                @if ($order->unique_code)
                    <div style="margin-top: 8px; font-size: 12px; color: #92400e; line-height: 1.4;">
                        ⚠️ <strong>PENTING:</strong> Mohon transfer tepat sejumlah <strong>Rp {{ number_format($order->total_amount, 0, ',', '.') }}</strong> hingga 3 digit terakhir agar sistem dapat mencocokkan pembayaran Anda secara otomatis.
                    </div>
                @endif
            </div>
        </div>
    @endif

    <div style="margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #171717; margin-bottom: 8px;">Ringkasan Produk:</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            @foreach ($order->items as $item)
                <tr style="border-bottom: 1px solid #f0ebe4;">
                    <td style="padding: 8px 0;">
                        <strong>{{ $item->product_name ?: ($item->product?->name ?? 'Parfum Mahakarya') }}</strong>
                        @if ($item->volume)
                            <span style="color: #737373;">({{ $item->volume }}ml)</span>
                        @endif
                        <br>
                        <span style="color: #737373;">{{ $item->quantity }}x @ Rp {{ number_format($item->price, 0, ',', '.') }}</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 700; vertical-align: top;">
                        Rp {{ number_format($item->subtotal ?: ($item->price * $item->quantity), 0, ',', '.') }}
                    </td>
                </tr>
            @endforeach
        </table>
    </div>

    <div class="btn-wrapper">
        <a href="{{ url('/payment/' . $order->order_number) }}" class="btn">Selesaikan Pembayaran</a>
        <div style="margin-top: 10px;">
            <a href="{{ url('/orders/' . $order->order_number . '/invoice') }}" style="font-size: 11px; color: #4A070B; text-decoration: underline; font-weight: 600;">Lihat Rincian Faktur / Invoice</a>
        </div>
    </div>

    <div class="security-note">
        <strong>Pengiriman ke:</strong><br>
        {{ $order->recipient_name }} ({{ $order->recipient_phone }})<br>
        {{ $order->address }}
    </div>
@endsection
