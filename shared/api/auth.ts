// Server-only auth helpers for the admin BFF layer.
// Imported exclusively by route handlers and the admin server layout —
// never from a client component (it would leak token handling to the browser).
import type { NextResponse } from 'next/server'

export const ACCESS_TOKEN_COOKIE = 'admin_access_token'
export const REFRESH_TOKEN_COOKIE = 'admin_refresh_token'

export const BACKEND_BASE_URL =
	process.env.BACKEND_BASE_URL ?? 'https://sakura.vps.webdock.cloud'

const DAY_SECONDS = 60 * 60 * 24
const REFRESH_TOKEN_MAX_AGE = Math.max(
	DAY_SECONDS,
	Number(process.env.ADMIN_REFRESH_TOKEN_MAX_AGE) || DAY_SECONDS * 30
)

export type LoginResponse = {
	accessToken: string
	refreshToken: string
	expiresIn: number
}

const cookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax',
	path: '/'
} as const

export function setAuthCookies(res: NextResponse, tokens: LoginResponse): void {
	res.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
		...cookieOptions,
		maxAge: Math.max(60, Number(tokens.expiresIn) || 3600)
	})
	res.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
		...cookieOptions,
		maxAge: REFRESH_TOKEN_MAX_AGE
	})
}

export function clearAuthCookies(res: NextResponse): void {
	res.cookies.delete(ACCESS_TOKEN_COOKIE)
	res.cookies.delete(REFRESH_TOKEN_COOKIE)
}

function isLoginResponse(value: unknown): value is LoginResponse {
	return (
		!!value &&
		typeof value === 'object' &&
		typeof (value as LoginResponse).accessToken === 'string' &&
		typeof (value as LoginResponse).refreshToken === 'string'
	)
}

// Single-flight: concurrent requests that all hit an expired access token
// share one refresh call, so a rotating refresh token is only spent once.
const inflightRefreshes = new Map<string, Promise<LoginResponse | null>>()

export function refreshAccessToken(
	refreshToken: string
): Promise<LoginResponse | null> {
	const existing = inflightRefreshes.get(refreshToken)
	if (existing) return existing

	const request = (async (): Promise<LoginResponse | null> => {
		try {
			const upstream = await fetch(
				`${BACKEND_BASE_URL}/api/v1/auth/refresh`,
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ refreshToken }),
					cache: 'no-store'
				}
			)
			if (!upstream.ok) return null
			const data = await upstream.json().catch(() => null)
			return isLoginResponse(data) ? data : null
		} catch {
			return null
		} finally {
			inflightRefreshes.delete(refreshToken)
		}
	})()

	inflightRefreshes.set(refreshToken, request)
	return request
}
