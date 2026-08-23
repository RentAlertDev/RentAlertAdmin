import type { Metadata } from 'next'
import { Toaster } from 'sonner'

import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
	title: { default: 'RentAlert', template: '%s — RentAlert' },
	description: 'Панель управления RentAlert'
}
const themeScript = `(()=>{try{const saved=localStorage.getItem('rent-alert-theme');const dark=saved?saved==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',dark)}catch{}})()`
export default function RootLayout({
	children
}: {
	children: React.ReactNode
}) {
	return (
		<html lang='ru' suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body>
				<Providers>{children}</Providers>
				<Toaster richColors position='top-right' />
			</body>
		</html>
	)
}
