import { NextResponse } from 'next/server'

import { clearAuthCookies } from '@/shared/api/auth'

export async function POST() {
	const res = NextResponse.json({ ok: true })
	clearAuthCookies(res)
	return res
}
