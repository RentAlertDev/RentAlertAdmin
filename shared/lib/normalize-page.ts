import type { Page } from '@/shared/model/types'

type PageMetadata = Pick<
	Page<never>,
	'number' | 'size' | 'totalElements' | 'totalPages'
>

export type SpringPageResponse<T> = Partial<Page<T>> & {
	content?: T[]
	page?: Partial<PageMetadata>
}

export function normalizePage<T>(response: SpringPageResponse<T>): Page<T> {
	const content = response.content ?? []
	const metadata = response.page ?? response
	const number = metadata.number ?? response.number ?? 0
	const size = metadata.size ?? response.size ?? content.length
	const totalElements =
		metadata.totalElements ?? response.totalElements ?? content.length
	const totalPages =
		metadata.totalPages ??
		response.totalPages ??
		(size > 0 ? Math.ceil(totalElements / size) : 0)

	return {
		content,
		number,
		size,
		totalElements,
		totalPages,
		first: response.first ?? number === 0,
		last: response.last ?? (totalPages === 0 || number + 1 >= totalPages)
	}
}
