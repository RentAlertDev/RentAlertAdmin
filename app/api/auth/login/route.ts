import { NextResponse } from 'next/server'

const base = process.env.BACKEND_BASE_URL ?? 'https://sakura.vps.webdock.cloud'
export async function POST(request: Request) {
	const body = await request.text()
	const upstream = await fetch(`${base}/api/v1/auth/admin/login`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body,
		cache: 'no-store'
	})
	const data = await upstream.json().catch(() => ({}))
	if (!upstream.ok)
		return NextResponse.json(data, { status: upstream.status })
	const response = NextResponse.json({ ok: true })
	response.cookies.set('admin_access_token', data.accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: Math.max(60, Number(data.expiresIn) || 3600)
	})
	return response
}
