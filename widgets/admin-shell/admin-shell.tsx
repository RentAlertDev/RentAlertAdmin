'use client'

import {
	BarChart3,
	Building2,
	ClipboardList,
	LogOut,
	MapPin,
	Megaphone,
	Menu,
	MessageSquare,
	Timer,
	Users,
	Wrench,
	X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { APP_ROUTES } from '@/shared/config/routes'
import { BrandLogo } from '@/shared/ui/brand-logo'
import { ThemeToggle } from '@/shared/ui/theme-toggle'

const links = [
	{ href: APP_ROUTES.ADMIN.DASHBOARD, label: 'Дашборд', icon: BarChart3 },
	{ href: APP_ROUTES.ADMIN.USERS, label: 'Пользователи', icon: Users },
	{ href: APP_ROUTES.ADMIN.JOBS, label: 'Фоновые задачи', icon: Wrench },
	{ href: APP_ROUTES.ADMIN.SCHEDULERS, label: 'Планировщики', icon: Timer },
	{ href: APP_ROUTES.ADMIN.FEEDBACKS, label: 'Отзывы', icon: MessageSquare },
	{ href: APP_ROUTES.ADMIN.CITIES, label: 'Города', icon: MapPin },
	{ href: APP_ROUTES.ADMIN.LISTINGS, label: 'Объявления', icon: Building2 },
	{ href: APP_ROUTES.ADMIN.BROADCASTS, label: 'Рассылки', icon: Megaphone },
	{ href: APP_ROUTES.ADMIN.AUDIT, label: 'Аудит', icon: ClipboardList }
]
export function AdminShell({ children }: { children: React.ReactNode }) {
	const path = usePathname()
	const router = useRouter()
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const logout = async () => {
		setIsMenuOpen(false)
		await fetch('/api/auth/logout', { method: 'POST' })
		router.replace(APP_ROUTES.LOGIN)
	}
	return (
		<>
			<aside className='desktop-sidebar fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200 bg-white p-5'>
				<div className='mb-9 flex items-center gap-3 px-2'>
					<BrandLogo size={46} />
					<div>
						<b className='text-lg'>RentAlert</b>
						<div className='text-xs text-slate-500'>Управление</div>
					</div>
				</div>
				<nav className='flex flex-1 flex-col gap-1'>
					{links.map(({ href, label, icon: Icon }) => (
						<Link
							key={href}
							href={href}
							className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${path.startsWith(href) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
						>
							<Icon size={19} />
							{label}
						</Link>
					))}
				</nav>
				<ThemeToggle />
				<button
					className='flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600'
					onClick={logout}
				>
					<LogOut size={19} />
					Выйти
				</button>
			</aside>
			<button
				type='button'
				aria-label='Закрыть меню'
				className={`mobile-overlay fixed inset-0 z-40 bg-slate-950/55 transition-opacity ${isMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
				onClick={() => setIsMenuOpen(false)}
			/>
			<aside
				aria-label='Мобильная навигация'
				className={`mobile-drawer fixed inset-y-0 left-0 z-50 w-[min(82vw,320px)] flex-col border-r border-slate-200 bg-white p-5 shadow-2xl transition-transform duration-200 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
			>
				<div className='mb-8 flex items-center gap-3 px-2'>
					<BrandLogo size={42} />
					<div className='flex-1'>
						<b className='text-lg'>RentAlert</b>
						<div className='text-xs text-slate-500'>Управление</div>
					</div>
					<button
						type='button'
						aria-label='Закрыть меню'
						className='grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-50'
						onClick={() => setIsMenuOpen(false)}
					>
						<X size={22} />
					</button>
				</div>
				<nav className='flex flex-1 flex-col gap-1'>
					{links.map(({ href, label, icon: Icon }) => (
						<Link
							key={href}
							href={href}
							onClick={() => setIsMenuOpen(false)}
							className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${path.startsWith(href) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
						>
							<Icon size={19} />
							{label}
						</Link>
					))}
				</nav>
				<ThemeToggle />
				<button
					className='flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600'
					onClick={logout}
				>
					<LogOut size={19} />
					Выйти
				</button>
			</aside>
			<main className='admin-main ml-64 min-h-screen'>
				<header className='mobile-nav hidden items-center gap-3 border-b bg-white p-4'>
					<button
						type='button'
						aria-label='Открыть меню'
						aria-expanded={isMenuOpen}
						className='grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-50'
						onClick={() => setIsMenuOpen(true)}
					>
						<Menu size={23} />
					</button>
					<BrandLogo size={34} />
					<b className='flex-1'>RentAlert</b>
					<ThemeToggle compact />
				</header>
				<div className='page-pad mx-auto max-w-[1500px] p-8'>
					{children}
				</div>
			</main>
		</>
	)
}
