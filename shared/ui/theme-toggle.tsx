'use client'

import { Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'

const themeEvent = 'rent-alert-theme-change'
const subscribe = (notify: () => void) => {
	window.addEventListener(themeEvent, notify)
	window.addEventListener('storage', notify)
	return () => {
		window.removeEventListener(themeEvent, notify)
		window.removeEventListener('storage', notify)
	}
}
const getSnapshot = () => document.documentElement.classList.contains('dark')
const getServerSnapshot = () => false
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
	const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
	const toggle = () => {
		const next = !dark
		document.documentElement.classList.toggle('dark', next)
		localStorage.setItem('rent-alert-theme', next ? 'dark' : 'light')
		window.dispatchEvent(new Event(themeEvent))
	}
	return (
		<button
			type='button'
			onClick={toggle}
			className='theme-toggle flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50'
			aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
		>
			{dark ? <Sun size={19} /> : <Moon size={19} />}{' '}
			{!compact && <span>{dark ? 'Светлая тема' : 'Тёмная тема'}</span>}
		</button>
	)
}
