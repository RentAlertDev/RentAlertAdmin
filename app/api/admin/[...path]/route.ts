import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const base = process.env.BACKEND_BASE_URL ?? 'https://sakura.vps.webdock.cloud'
async function proxy(
	req: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	const token = (await cookies()).get('admin_access_token')?.value
	if (!token)
		return NextResponse.json(
			{ message: 'Требуется авторизация' },
			{ status: 401 }
		)
	const { path } = await params
	const url = new URL(`${base}/api/v1/admin/${path.join('/')}`)
	req.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v))
	const body =
		req.method === 'GET' || req.method === 'HEAD'
			? undefined
			: await req.arrayBuffer()
	const upstream = await fetch(url, {
		method: req.method,
		headers: {
			authorization: `Bearer ${token}`,
			...(req.headers.get('content-type')
				? { 'content-type': req.headers.get('content-type')! }
				: {})
		},
		body,
		cache: 'no-store'
	})
	const responseBody = await upstream.arrayBuffer()
	return new NextResponse(responseBody, {
		status: upstream.status,
		headers: {
			'content-type':
				upstream.headers.get('content-type') || 'application/json'
		}
	})
}
export const GET = proxy
export const POST = proxy
