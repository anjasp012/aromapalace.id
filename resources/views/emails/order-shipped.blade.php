@extends('emails.layout')

@section('content')
    <div class="greeting">Pesanan Anda Sedang Dalam Pengiriman!</div>

    <p>Halo <strong>{{ $order->recipient_name }}</strong>, paket wewangian pesanan Anda telah diserahkan kepada kurir pengiriman dan saat ini sedang menuju ke alamat tujuan Anda.</p>

    <div class="card-box" style="text-align: center; background-color: #faf4ed; border-color: #E8D0BA;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8C1D24; font-weight: 700;">Nomor Resi / AWB</span>
        <div style="font-size: 22px; font-weight: 800; color: #4A070B; margin: 6px 0; font-family: monospace; letter-spacing: 1px;">
            {{ $order->shipping?->awb ?: ($order->tracking_number ?: 'Diproses Kurir') }}
        </div>
        <div style="font-size: 12px; color: #737373;">
            Kurir Ekspedisi: <strong style="color: #171717;">{{ $order->courier ?: 'Kurir Pengiriman' }}</strong>
            @if ($order->courier_service)
                ({{ $order->courier_service }})
            @endif
        </div>
    </div>

    <div class="btn-wrapper">
        <a href="{{ url('/account/orders') }}" class="btn">Lacak Paket Pengiriman</a>
    </div>

    <div class="card-box" style="font-size: 12px; color: #525252;">
        <strong>Alamat Tujuan Penerima:</strong><br>
        <span style="color: #171717; font-weight: 600;">{{ $order->recipient_name }}</span> ({{ $order->recipient_phone }})<br>
        {{ $order->address }}
    </div>

    <div class="security-note">
        <strong>Tips Penerimaan Paket:</strong><br>
        Pastikan untuk merekam video unboxing saat membuka paket demi kenyamanan dan perlindungan garansi tukar aroma Aroma Palace.
    </div>
@endsection
