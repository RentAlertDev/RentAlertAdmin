import { isAxiosError } from 'axios'

// Единый формат ошибок API:
// { "message": "...", "details": { "errorId": "uuid", "errorCode": "400", ...поля } }
type ApiErrorBody = {
	message?: string
	details?: Record<string, unknown>
}

export function apiStatus(error: unknown): number | undefined {
	return isAxiosError(error) ? error.response?.status : undefined
}

export function apiErrorMessage(error: unknown, fallback: string): string {
	if (isAxiosError<ApiErrorBody>(error) && error.response?.data?.message)
		return error.response.data.message
	return fallback
}

export function apiErrorId(error: unknown): string | undefined {
	const id = isAxiosError<ApiErrorBody>(error)
		? error.response?.data?.details?.errorId
		: undefined
	return typeof id === 'string' ? id : undefined
}

export function apiErrorCode(error: unknown): string | undefined {
	const code = isAxiosError<ApiErrorBody>(error)
		? error.response?.data?.details?.errorCode
		: undefined
	return typeof code === 'string' ? code : undefined
}

// Сообщения валидации по полям — всё из details, кроме служебных ключей.
export function apiFieldErrors(error: unknown): Record<string, string> {
	const out: Record<string, string> = {}
	const details =
		isAxiosError<ApiErrorBody>(error) && error.response?.data?.details
	if (details)
		for (const [key, value] of Object.entries(details)) {
			if (key === 'errorId' || key === 'errorCode') continue
			if (typeof value === 'string') out[key] = value
		}
	return out
}
