import type { CityProvider } from '@/shared/model/types'

// Значения строго как на бэке; лейблы — только для отображения.
export const CITY_PROVIDERS: readonly CityProvider[] = [
	'KUFAR',
	'REALT',
	'ONLINER'
]

export const PROVIDER_LABELS: Record<string, string> = {
	KUFAR: 'Kufar',
	REALT: 'Realt',
	ONLINER: 'Onliner'
}

export const providerLabel = (provider: string) =>
	PROVIDER_LABELS[provider] ?? provider
