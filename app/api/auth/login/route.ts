import { NextResponse } from 'next/server'

import { BACKEND_BASE_URL, setAuthCookies } from '@/shared/api/auth'
import type { LoginResponse } from '@/shared/api/auth'

export async function POST(request: Request) {
	const body = await request.text()
	const upstream = await fetch(
		`${BACKEND_BASE_URL}/api/v1/auth/admin/login`,
		{
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body,
			cache: 'no-store'
		}
	)
	const data = await upstream.json().catch(() => ({}))
	if (!upstream.ok)
		return NextResponse.json(data, { status: upstream.status })
	const response = NextResponse.json({ ok: true })
	setAuthCookies(response, data as LoginResponse)
	return response
}
