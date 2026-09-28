import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';

  // Redirect to /api/auth/callback/oneid preserving query params
  return NextResponse.redirect(
    new URL(`/api/auth/callback/oneid?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, request.url)
  );
}
