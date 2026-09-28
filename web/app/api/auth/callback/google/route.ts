import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Google Autentifikatsiyasi - WorkHub</title>
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
      max-width: 420px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .spinner {
      border: 3.5px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
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
      background: #2563eb;
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
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner" id="spinner"></div>
    <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 8px;" id="title">Google orqali kirilmoqda...</h3>
    <p style="font-size: 13px; color: #94a3b8; margin: 0;" id="status">WorkHub hisobingiz tasdiqlanmoqda, bir oz kuting.</p>
    <button class="btn" id="closeBtn" style="display: none;" onclick="window.close();">Oynani yopish</button>
  </div>
  <script>
    (function() {
      try {
        var hash = window.location.hash || '';
        var search = window.location.search || '';
        var hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        var searchParams = new URLSearchParams(search.replace(/^\\?/, ''));
        
        var accessToken = hashParams.get('access_token') || searchParams.get('access_token') || '';
        var code = searchParams.get('code') || hashParams.get('code') || '';
        
        var authData = {
          type: 'WORKHUB_GOOGLE_AUTH_CALLBACK',
          accessToken: accessToken,
          code: code,
          hash: hash,
          search: search,
          timestamp: Date.now()
        };

        // 1. Store in localStorage (shared with opener window)
        if (accessToken || code) {
          localStorage.setItem('workhub_google_auth_token', JSON.stringify(authData));
        }

        // 2. Post message to opener if available
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(authData, '*');
          } catch (e) {
            console.warn('postMessage error', e);
          }
        }

        document.getElementById('title').innerText = 'Muvaffaqiyatli!';
        document.getElementById('status').innerText = 'Google hisobingiz tasdiqlandi. WorkHub ochilmoqda...';
        document.getElementById('spinner').style.display = 'none';

        // 3. Close popup or redirect to main app
        if (window.opener && !window.opener.closed) {
          setTimeout(function() {
            window.close();
          }, 600);
        } else {
          setTimeout(function() {
            var targetHash = hash || (code ? '#code=' + code : '');
            window.location.href = '/' + targetHash;
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
