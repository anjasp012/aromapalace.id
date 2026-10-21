<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $order['invoice_number'] }}</title>
    <style>
        @page {
            size: A4;
            margin: 28px 32px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            line-height: 1.45;
            color: #1f2937;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table {
            border-bottom: 1.5px solid #e5e7eb;
            padding-bottom: 12px;
            margin-bottom: 14px;
        }
        .brand-logo {
            font-size: 24px;
            font-weight: 800;
            color: #111827;
            letter-spacing: -0.5px;
        }
        .brand-logo span {
            font-weight: 300;
            color: #6b7280;
        }
        .brand-sub {
            font-size: 9px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 2px;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h1 {
            font-size: 16px;
            font-weight: 900;
            color: #111827;
            margin: 0;
            letter-spacing: 1px;
        }
        .invoice-number {
            font-family: monospace;
            font-size: 10px;
            color: #4b5563;
            margin-top: 3px;
        }
        .meta-table {
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 12px;
            margin-bottom: 14px;
            font-size: 10.5px;
        }
        .meta-heading {
            font-size: 9px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .meta-label {
            color: #6b7280;
        }
        .meta-value {
            font-weight: 700;
            color: #111827;
        }
        .meta-sub {
            font-size: 9.5px;
            color: #4b5563;
        }
        .items-table {
            margin-bottom: 14px;
        }
        .items-table th {
            background-color: #f9fafb;
            border-bottom: 1.5px solid #e5e7eb;
            padding: 8px 6px;
            font-size: 10px;
            font-weight: 700;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .items-table td {
            padding: 10px 6px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
            font-size: 10.5px;
        }
        .product-title {
            font-weight: 700;
            color: #2563eb;
            font-size: 11px;
        }
        .product-variant {
            font-size: 9.5px;
            color: #6b7280;
            margin-top: 2px;
        }
        .totals-table td {
            padding: 3px 0;
            font-size: 10.5px;
        }
        .totals-label {
            color: #4b5563;
        }
        .totals-val {
            text-align: right;
            font-weight: 600;
            color: #111827;
        }
        .total-highlight {
            border-top: 1.5px solid #e5e7eb;
            padding-top: 8px !important;
            margin-top: 4px;
        }
        .total-highlight .totals-label {
            font-weight: 800;
            font-size: 12px;
            color: #111827;
        }
        .total-highlight .totals-val {
            font-weight: 900;
            font-size: 13px;
            color: #030712;
        }
        .shipping-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 10px 12px;
            margin-top: 14px;
            font-size: 10.5px;
        }
        .watermark {
            position: absolute;
            left: 20%;
            top: 55%;
            transform: rotate(-15deg);
            padding: 8px 24px;
            border-radius: 8px;
            font-size: 26px;
            font-weight: 900;
            letter-spacing: 5px;
            text-transform: uppercase;
            text-align: center;
            opacity: 0.22;
        }
        .watermark-paid {
            border: 3px solid #059669;
            color: #059669;
        }
        .watermark-unpaid {
            border: 3px solid #e11d48;
            color: #e11d48;
        }
        .footer-note {
            text-align: center;
            font-size: 9.5px;
            color: #9ca3af;
            margin-top: 24px;
            border-top: 1px dashed #e5e7eb;
            padding-top: 10px;
        }
    </style>
</head>
<body>

    @if ($order['is_paid'])
        <div class="watermark watermark-paid">LUNAS</div>
    @else
        <div class="watermark watermark-unpaid">BELUM LUNAS</div>
    @endif

    <!-- Header Row -->
    <table class="header-table">
        <tr>
            <td style="width: 60%;">
                <div class="brand-logo">aroma<span>palace</span></div>
                <div class="brand-sub">Official Luxury Boutique</div>
            </td>
            <td style="width: 40%;" class="invoice-title">
                <h1>INVOICE</h1>
                <div class="invoice-number">{{ $order['invoice_number'] }}</div>
            </td>
        </tr>
    </table>

    <!-- Metadata Section -->
    <table class="meta-table">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                <div class="meta-heading">Diterbitkan Atas Nama</div>
                <div class="meta-label">Penjual:</div>
                <div class="meta-value">{{ $seller['name'] }}</div>
                <div class="meta-sub">{{ $seller['store_name'] }}</div>
            </td>
            <td style="width: 50%; vertical-align: top;">
                <div class="meta-heading">Ditujukan Untuk</div>
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 50%; vertical-align: top;">
                            <div class="meta-label">Pembeli:</div>
                            <div class="meta-value">{{ $buyer['name'] }}</div>
                        </td>
                        <td style="width: 50%; vertical-align: top;">
                            <div class="meta-label">Tanggal Pembelian:</div>
                            <div class="meta-value">{{ $order['created_at'] }}</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Products Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 45%; text-align: left;">Informasi Pesanan</th>
                <th style="width: 20%; text-align: right;">Harga Satuan</th>
                <th style="width: 15%; text-align: center;">Kuantitas</th>
                <th style="width: 20%; text-align: right;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order['items'] as $item)
                <tr>
                    <td>
                        <div class="product-title">{{ $item['product_name'] }}</div>
                        <div class="product-variant">
                            @if (!empty($item['variant_name']))
                                Varian: {{ $item['variant_name'] }}
                            @endif
                            @if (!empty($item['variant_name']) && !empty($item['volume']))
                                &bull;
                            @endif
                            @if (!empty($item['volume']))
                                Volume: {{ $item['volume'] }}
                            @endif
                        </div>
                    </td>
                    <td style="text-align: right; font-weight: 500;">
                        {{ $item['price_formatted'] }}
                    </td>
                    <td style="text-align: center; font-weight: 500;">
                        {{ $item['quantity'] }}
                    </td>
                    <td style="text-align: right; font-weight: 700;">
                        {{ $item['total_price_formatted'] }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Totals Calculation -->
    <table style="width: 100%;">
        <tr>
            <td style="width: 40%; vertical-align: top;">
                <div class="meta-heading">Metode Pembayaran</div>
                <div style="font-weight: 700; font-size: 11px; color: #111827;">
                    {{ $order['payment_channel'] }}
                </div>
            </td>
            <td style="width: 60%; vertical-align: top;">
                <table class="totals-table">
                    <tr>
                        <td class="totals-label">Total Harga ({{ $order['items_count'] }} produk)</td>
                        <td class="totals-val">{{ $order['subtotal_formatted'] }}</td>
                    </tr>
                    <tr>
                        <td class="totals-label">Total Ongkos Kirim</td>
                        <td class="totals-val">{{ $order['shipping_cost_formatted'] }}</td>
                    </tr>
                    <tr>
                        <td class="totals-label">Total Asuransi Pengiriman</td>
                        <td class="totals-val">Rp 0</td>
                    </tr>
                    @if ($order['discount_amount'] > 0)
                        <tr>
                            <td class="totals-label" style="color: #e11d48;">
                                Voucher Diskon {{ !empty($order['voucher_code']) ? '('.$order['voucher_code'].')' : '' }}
                            </td>
                            <td class="totals-val" style="color: #e11d48;">
                                - {{ $order['discount_amount_formatted'] }}
                            </td>
                        </tr>
                    @endif
                    <tr>
                        <td class="totals-label">Biaya Layanan & Pajak</td>
                        <td class="totals-val">Rp 0</td>
                    </tr>
                    <tr class="total-highlight">
                        <td class="totals-label">Total Tagihan</td>
                        <td class="totals-val">{{ $order['total_amount_formatted'] }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Shipping Info Box -->
    <div class="shipping-box">
        <table style="width: 100%;">
            <tr>
                <td style="width: 35%; vertical-align: top;">
                    <div class="meta-heading">Metode Pengiriman</div>
                    <div style="font-weight: 700; color: #111827;">{{ $order['courier'] }}</div>
                </td>
                <td style="width: 65%; vertical-align: top;">
                    <div class="meta-heading">Alamat Pengiriman</div>
                    <div style="font-weight: 700; color: #111827;">
                        {{ $order['recipient_name'] }} ({{ $order['recipient_phone'] }})
                    </div>
                    <div style="color: #4b5563; font-size: 10px; margin-top: 2px;">
                        {{ $order['shipping_address'] }}{{ !empty($order['city']) ? ', '.$order['city'] : '' }}{{ !empty($order['postal_code']) ? ', '.$order['postal_code'] : '' }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Footer Note -->
    <div class="footer-note">
        Invoice ini sah dan diproses secara otomatis oleh komputer Aroma Palace.<br>
        Layanan Bantuan Pelanggan: https://aromapalace.id &bull; WhatsApp Resmi Official Boutique
    </div>

</body>
</html>
