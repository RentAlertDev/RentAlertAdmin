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
export type UserProfile = {
	userId: number
	username: string
	photoUrl?: string
	botStatus: 'ACTIVE' | 'PAUSED' | 'STOPPED'
	roleName?: 'USER' | 'ADMIN' | 'BLOCKED'
	lastLogin?: string
	quietFrom?: string
	quietTo?: string
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
export type Feedback = {
	id: number
	userId: number
	username: string
	message: string
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
	createdAt: string
}
export type BroadcastResult = {
	broadcastId: number
	totalRecipients: number
	sent: number
	failed: number
	skipped: number
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
