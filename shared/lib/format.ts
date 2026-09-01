export const dateInput = (date: Date) => date.toISOString().slice(0, 10)
export const daysAgo = (days = 30) => {
	const d = new Date()
	d.setDate(d.getDate() - days)
	return dateInput(d)
}
export const formatDateTime = (value?: string | null) =>
	value
		? new Intl.DateTimeFormat('ru-RU', {
				dateStyle: 'short',
				timeStyle: 'short'
			}).format(new Date(value))
		: '—'
export const formatDate = (value?: string | null) =>
	value
		? new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(
				new Date(value)
			)
		: '—'
export const formatDuration = (ms?: number | null) =>
	ms == null ? '—' : ms < 1000 ? `${ms} мс` : `${(ms / 1000).toFixed(2)} сек`
export const formatRange = (
	from?: number | null,
	to?: number | null,
	unit?: string
) => {
	const u = unit ? ` ${unit}` : ''
	if (from == null && to == null) return '—'
	if (from != null && to != null) return `${from} – ${to}${u}`
	if (from != null) return `от ${from}${u}`
	return `до ${to}${u}`
}
export const initials = (name?: string | null) =>
	(name || 'U').replace('@', '').slice(0, 2).toUpperCase()
