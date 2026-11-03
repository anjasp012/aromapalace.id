@extends('emails.layout')

@section('content')
    <div class="greeting">Halo, {{ $user->name }}</div>

    <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Aroma Palace Anda.</p>

    <p>Klik tombol di bawah ini untuk membuat kata sandi baru:</p>

    <div class="btn-wrapper">
        <a href="{{ $resetUrl }}" class="btn">Atur Ulang Kata Sandi Akun</a>
    </div>

    <div class="card-box" style="font-size: 12px; color: #525252;">
        <strong>Perhatian Penting:</strong>
        <ul style="margin: 6px 0 0; padding-left: 18px;">
            <li>Tautan reset kata sandi ini hanya berlaku selama <strong>60 menit</strong>.</li>
            <li>Demi keamanan, jangan pernah membagikan tautan ini kepada siapa pun.</li>
        </ul>
    </div>

    <div class="security-note">
        <strong>Tidak meminta reset kata sandi?</strong><br>
        Jika Anda tidak pernah meminta perubahan kata sandi ini, abaikan email ini. Akun Anda tetap aman dan kata sandi Anda tidak akan berubah.
    </div>

    <div class="divider"></div>

    <p style="font-size: 11px; color: #a3a3a3; word-break: break-all;">
        Jika tombol di atas tidak dapat diklik, salin dan tempel URL berikut ke browser Anda:<br>
        <a href="{{ $resetUrl }}" style="color: #4A070B;">{{ $resetUrl }}</a>
    </p>
@endsection

