<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'Aroma Palace' }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f7f5f2;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #262626;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #f7f5f2;
            padding: 30px 15px;
            box-sizing: border-box;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #e7e2da;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        .header {
            background: linear-gradient(135deg, #4A070B 0%, #2A0406 100%);
            padding: 36px 30px 30px;
            text-align: center;
            border-bottom: 2px solid #E5A844;
        }
        .brand-title {
            color: #FFFFFF;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin: 0;
        }
        .brand-subtitle {
            color: #E8D0BA;
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 6px;
            font-weight: 500;
        }
        .content {
            padding: 36px 32px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 700;
            color: #171717;
            margin-bottom: 14px;
        }
        p {
            font-size: 14px;
            color: #404040;
            margin: 0 0 16px;
        }
        .btn-wrapper {
            text-align: center;
            margin: 28px 0;
        }
        .btn {
            display: inline-block;
            background-color: #4A070B;
            color: #E8D0BA !important;
            text-decoration: none;
            padding: 13px 32px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.5px;
            border: 1px solid #8C1D24;
            box-shadow: 0 2px 8px rgba(74, 7, 11, 0.25);
        }
        .card-box {
            background-color: #faf7f4;
            border: 1px solid #ede7df;
            border-radius: 12px;
            padding: 18px 20px;
            margin: 20px 0;
        }
        .divider {
            height: 1px;
            background-color: #ede7df;
            margin: 24px 0;
        }
        .footer {
            background-color: #fcfbfa;
            border-top: 1px solid #ede7df;
            padding: 24px 30px;
            text-align: center;
            font-size: 11px;
            color: #737373;
            line-height: 1.5;
        }
        .footer a {
            color: #4A070B;
            text-decoration: none;
            font-weight: 600;
        }
        .security-note {
            font-size: 12px;
            color: #737373;
            background-color: #fafafa;
            border-left: 3px solid #E5A844;
            padding: 10px 14px;
            margin-top: 24px;
            border-radius: 0 8px 8px 0;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="brand-title">AROMA PALACE</div>
                <div class="brand-subtitle">The Essence of Dubai &bull; Official Boutique</div>
            </div>

            <!-- Content Area -->
            <div class="content">
                @yield('content')
            </div>

            <!-- Footer -->
            <div class="footer">
                <p style="margin: 0 0 6px; font-weight: 600; color: #262626;">Aroma Palace Official Boutique</p>
                <p style="margin: 0 0 10px;">Official luxury boutique parfum berkarakter mewah khas Dubai di Indonesia.</p>
                <p style="margin: 0; font-size: 10px; color: #a3a3a3;">
                    &copy; {{ date('Y') }} Aroma Palace. Hak cipta dilindungi undang-undang.<br>
                    Email ini dikirim secara otomatis. Mohon tidak membalas langsung ke alamat email ini.
                </p>
            </div>
        </div>
    </div>
</body>
</html>

