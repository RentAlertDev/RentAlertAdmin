export type Page<T> = {
	content: T[]
	totalElements: number
	totalPages: number
	number: number
	size: number
	first: boolean
	last: boolean
}
export type SystemActivity = {
	totalActiveUsers: number
	totalUsersToday?: number
	totalUsersThisWeek?: number
	newUsersToday?: number
	newUsersThisWeek?: number
	totalNewUsersToday?: number
	totalNewUsersThisWeek?: number
	totalFeedbacks: number
	eventDistribution: Record<string, number>
	topActiveUsers: { userId: number; actionCount: number; username?: string }[]
}
export type UserStatistics = {
	listingsReceivedToday: number
	favoritesAddedToday: number
	favoritesRemovedToday: number
	filterUpdatesToday: number
	averageListingsPerWeek: number
	loginCountToday: number
	profileUpdatesToday: number
	notificationsSettingsUpdatesToday: number
	botCommandsToday: number
	feedbackCountToday: number
	totalActionsToday: number
	lastActivityDate: string
}
export type UserActionSummary = {
	userId: number
	username: string
	lastActivityDate: string
	totalActions: number
	loginCount: number
	favoriteActions: number
	filterActions: number
	botCommandCount: number
	feedbackCount: number
	callbackCount: number
	actionRatePerDay: number
}
export type UserActivityLog = {
	eventType: string
	eventDate: string
	count: number
}
export type FilterCurrency = 'USD' | 'BYN' | 'EUR'
export type UserFilter = {
	id: number
	priceFrom?: number | null
	priceTo?: number | null
	roomsFrom?: number | null
	roomsTo?: number | null
	areaFrom?: number | null
	areaTo?: number | null
	active: boolean
	currency: FilterCurrency
	createdAt: string
	updatedAt?: string
}
export type UserProfile = {
	userId: number
	username: string
	photoUrl?: string
	botStatus: 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'BLOCKED'
	roleName?: 'USER' | 'ADMIN' | 'BLOCKED'
	lastLogin?: string
	quietFrom?: string
	quietTo?: string
	registeredAt?: string
	activeFilters: UserFilter[]
	recentFeedbacks: Feedback[]
}
export type JobSetting = {
	jobName: string
	initiator: string
	description: string
	affectedRecords: number
	executionScope: string
	startedAt: string
	finishedAt?: string
	executionTimeMs?: number
}
export type AuditLog = {
	id: number
	eventName: string
	eventDescription?: string
	userId?: number
	eventInitiator: 'INTERNAL' | 'USER' | 'ADMIN' | string
	eventStatus?: string
	createdAt: string
}
export type AuditLogPage = {
	content: AuditLog[]
	page: {
		size: number
		number: number
		totalElements: number
		totalPages: number
	}
}
export type SchedulerSettings = {
	id: number
	schedulerEnabled: boolean
	providerName: 'KUFAR' | 'REALT' | 'ONLINER' | string
	notificationsEnabled: boolean
	fixedRateMs: number
	pageSize: number
	priceFrom?: number
	priceTo?: number
	priceCurrency?: string
	regionId?: string
	sortBy?: string
	sortOrder?: string
	categoryId?: number
	createdAt?: string
	updatedAt?: string
}
export type SchedulerSettingsRequest = {
	providerName: string
	schedulerEnabled: boolean
	notificationsEnabled: boolean
	fixedRateMs: number
	pageSize: number
	priceFrom?: number
	priceTo?: number
	priceCurrency?: string
	regionId: string
	sortBy: string
	sortOrder: string
	categoryId: number
}
export type CityProvider = 'KUFAR' | 'REALT' | 'ONLINER'
export type ListingProvider = CityProvider

export type ListingProviderStat = {
	provider: ListingProvider
	total: number
	active: number
	inactive: number
	sharePercent: number
	lastParsedAt?: string
	minutesSinceLastParsed?: number
}
export type ListingCityStat = {
	city?: string
	total: number
	active: number
}
export type ListingCityProviderStat = {
	city?: string
	provider: ListingProvider
	total: number
}
export type ListingDailyArrival = {
	date: string
	total: number
	byProvider: Partial<Record<ListingProvider, number>>
}
export type ListingPeriodStats = {
	since: string
	until: string
	days: number
	newTotal: number
	newPerDay: number
	newByProvider: {
		provider: ListingProvider
		count: number
		perDay: number
	}[]
	newByCity: { city?: string; count: number; perDay: number }[]
	newByCityAndProvider: {
		city?: string
		provider: ListingProvider
		count: number
		perDay: number
	}[]
	dailyArrivals: ListingDailyArrival[]
}
export type ListingPriceStat = {
	currency: 'USD' | 'BYN' | 'EUR'
	count: number
	avgPrice: number
	minPrice: number
	maxPrice: number
}
export type ListingStatisticsOverview = {
	totalListings: number
	activeListings: number
	inactiveListings: number
	byProvider: ListingProviderStat[]
	byCity: ListingCityStat[]
	byCityAndProvider: ListingCityProviderStat[]
	period: ListingPeriodStats
	newLast24h: number
	newLast7d: number
	newLast30d: number
	staleProviders: ListingProvider[]
	priceStats: ListingPriceStat[]
	roomsDistribution: Record<string, number>
	dataQuality: {
		withoutCity: number
		withoutPrice: number
		withoutPhotos: number
	}
}
export type City = {
	id: number
	provider: CityProvider
	name: string
	cityCode: string
	active: boolean
	createdAt: string
	updatedAt: string
}
export type Feedback = {
	id: number
	userId: number
	username: string
	message?: string | null
	rating: number
	createdAt: string
	updatedAt?: string
}
export type Broadcast = {
	id: number
	message: string
	createdByUserId: number
	createdByUsername: string
	totalRecipients: number
	sent: number
	failed: number
	skipped: number
	pinned?: boolean
	createdAt: string
}
export type BroadcastResult = {
	broadcastId: number
	totalRecipients: number
	sent: number
	failed: number
	skipped: number
}
export type RoommateModerationSubjectType = 'PROFILE' | 'LISTING'
export type RoommateModerationField = 'bio' | 'description' | 'report'
export type RoommateModerationTask = {
	id: number
	subjectType: RoommateModerationSubjectType
	subjectId: number
	field: RoommateModerationField
	submittedText?: string | null
	status: 'PENDING_MANUAL'
	reviewerId?: number | null
	decisionReason?: string | null
	createdAt: string
}
export type BroadcastRecipient = {
	id: number
	userId: number
	username: string
	photoUrl?: string
	status: 'SENT' | 'FAILED' | 'SKIPPED'
	errorMessage?: string
	createdAt: string
}
