import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OneID Autentifikatsiyasi - WorkHub</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #0b0f19;
      color: #f8fafc;
    }
    .card {
      text-align: center;
      padding: 36px 30px;
      border-radius: 20px;
      background: #131b2e;
      border: 1px solid #1e293b;
      max-width: 440px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: #0047ba;
      color: #fff;
      font-weight: 900;
      font-size: 20px;
      margin-bottom: 16px;
      box-shadow: 0 4px 14px rgba(0, 71, 186, 0.4);
    }
    .spinner {
      border: 3.5px solid rgba(0, 71, 186, 0.2);
      border-top-color: #0047ba;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .btn {
      display: inline-block;
      margin-top: 18px;
      padding: 10px 24px;
      background: #0047ba;
      color: #fff;
      font-weight: 700;
      font-size: 13px;
      border-radius: 12px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #00368c;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">ID</div>
    <div class="spinner" id="spinner"></div>
    <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 8px;" id="title">OneID orqali kirilmoqda...</h3>
    <p style="font-size: 13px; color: #94a3b8; margin: 0;" id="status">id.egov.uz orqali shaxsiy ma’lumotlaringiz tasdiqlanmoqda, bir oz kuting.</p>
    <button class="btn" id="closeBtn" style="display: none;" onclick="window.close();">Oynani yopish</button>
  </div>
  <script>
    (function() {
      try {
        var search = window.location.search || '';
        var searchParams = new URLSearchParams(search.replace(/^\\?/, ''));
        var code = searchParams.get('code') || '';
        var state = searchParams.get('state') || '';
        
        var authData = {
          type: 'WORKHUB_ONEID_AUTH_CALLBACK',
          code: code,
          state: state,
          search: search,
          timestamp: Date.now()
        };

        if (code) {
          localStorage.setItem('workhub_oneid_auth_callback', JSON.stringify(authData));
        }

        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(authData, '*');
          } catch (e) {
            console.warn('postMessage error', e);
          }
        }

        document.getElementById('title').innerText = 'Muvaffaqiyatli!';
        document.getElementById('status').innerText = 'OneID hisobingiz tasdiqlandi. Profil ma’lumotlari yuklanmoqda...';
        document.getElementById('spinner').style.display = 'none';

        if (window.opener && !window.opener.closed) {
          setTimeout(function() {
            window.close();
          }, 600);
        } else {
          setTimeout(function() {
            window.location.href = '/?oneid_code=' + encodeURIComponent(code);
          }, 800);
        }
      } catch (err) {
        console.error('Callback error', err);
        document.getElementById('status').innerText = 'Xatolik yuz berdi. Iltimos, bosh sahifaga qayting.';
        document.getElementById('closeBtn').style.display = 'inline-block';
      }
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
