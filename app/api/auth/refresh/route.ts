import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import {
	REFRESH_TOKEN_COOKIE,
	clearAuthCookies,
	refreshAccessToken,
	setAuthCookies
} from '@/shared/api/auth'

export async function POST() {
	const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value
	const tokens = refreshToken ? await refreshAccessToken(refreshToken) : null

	if (!tokens) {
		const res = NextResponse.json(
			{ message: 'Сессия истекла' },
			{ status: 401 }
		)
		clearAuthCookies(res)
		return res
	}

	const res = NextResponse.json({ ok: true })
	setAuthCookies(res, tokens)
	return res
}
