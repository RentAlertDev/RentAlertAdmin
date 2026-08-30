import { NextRequest, NextResponse } from 'next/server'

import {
	ACCESS_TOKEN_COOKIE,
	BACKEND_BASE_URL,
	REFRESH_TOKEN_COOKIE,
	clearAuthCookies,
	refreshAccessToken,
	setAuthCookies
} from '@/shared/api/auth'
import type { LoginResponse } from '@/shared/api/auth'

async function proxy(
	req: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	let accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value
	const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value

	if (!accessToken && !refreshToken)
		return NextResponse.json(
			{ message: 'Требуется авторизация' },
			{ status: 401 }
		)

	const { path } = await params
	const url = new URL(`${BACKEND_BASE_URL}/api/v1/admin/${path.join('/')}`)
	req.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v))
	const body =
		req.method === 'GET' || req.method === 'HEAD'
			? undefined
			: await req.arrayBuffer()
	const contentType = req.headers.get('content-type')

	const send = (bearer: string | undefined) =>
		fetch(url, {
			method: req.method,
			headers: {
				...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
				...(contentType ? { 'content-type': contentType } : {})
			},
			body,
			cache: 'no-store'
		})

	let refreshedTokens: LoginResponse | null = null

	// Access token cookie already gone (outlived its maxAge) — refresh up front.
	if (!accessToken && refreshToken) {
		refreshedTokens = await refreshAccessToken(refreshToken)
		if (!refreshedTokens) return sessionExpired()
		accessToken = refreshedTokens.accessToken
	}

	let upstream = await send(accessToken)

	// Access token was still cached but the backend rejected it — refresh once and retry.
	if (upstream.status === 401 && refreshToken && !refreshedTokens) {
		refreshedTokens = await refreshAccessToken(refreshToken)
		if (refreshedTokens) upstream = await send(refreshedTokens.accessToken)
	}

	if (upstream.status === 401) return sessionExpired()

	const responseBody = await upstream.arrayBuffer()
	const res = new NextResponse(responseBody, {
		status: upstream.status,
		headers: {
			'content-type':
				upstream.headers.get('content-type') || 'application/json'
		}
	})
	if (refreshedTokens) setAuthCookies(res, refreshedTokens)
	return res
}

function sessionExpired() {
	const res = NextResponse.json(
		{ message: 'Сессия истекла' },
		{ status: 401 }
	)
	clearAuthCookies(res)
	return res
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
