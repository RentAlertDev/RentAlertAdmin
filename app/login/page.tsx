'use client'

import { LoaderCircle, LockKeyhole, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { APP_ROUTES } from '@/shared/config/routes'
import { BrandLogo } from '@/shared/ui/brand-logo'
import { ThemeToggle } from '@/shared/ui/theme-toggle'

export default function Login() {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const submit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setLoading(true)
		setError('')
		const form = new FormData(e.currentTarget)
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					username: form.get('username'),
					password: form.get('password')
				})
			})
			if (!response.ok)
				throw new Error(
					response.status === 401
						? 'Неверный логин или пароль'
						: 'Не удалось войти'
				)
			router.replace(APP_ROUTES.ADMIN.DASHBOARD)
			router.refresh()
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось войти')
		} finally {
			setLoading(false)
		}
	}
	return (
		<main className='login-screen relative grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#e9e8ff,transparent_45%),#f5f7fb] p-5'>
			<div className='absolute right-5 top-5'>
				<ThemeToggle compact />
			</div>
			<form onSubmit={submit} className='card w-full max-w-md p-8'>
				<div className='mb-7 flex items-center gap-3'>
					<BrandLogo size={58} />
					<div>
						<h1 className='text-2xl font-bold'>RentAlert</h1>
						<p className='text-sm text-slate-500'>
							Панель управления
						</p>
					</div>
				</div>
				<label className='mb-2 block text-sm font-semibold'>
					Логин
				</label>
				<div className='relative mb-5'>
					<User
						className='absolute left-3 top-3 text-slate-400'
						size={19}
					/>
					<input
						name='username'
						autoComplete='username'
						required
						className='field !pl-10'
						placeholder='Введите логин'
					/>
				</div>
				<label className='mb-2 block text-sm font-semibold'>
					Пароль
				</label>
				<div className='relative mb-5'>
					<LockKeyhole
						className='absolute left-3 top-3 text-slate-400'
						size={19}
					/>
					<input
						name='password'
						type='password'
						autoComplete='current-password'
						required
						className='field !pl-10'
						placeholder='Введите пароль'
					/>
				</div>
				{error && (
					<p className='mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600'>
						{error}
					</p>
				)}
				<button disabled={loading} className='btn btn-primary w-full'>
					{loading ? (
						<LoaderCircle className='animate-spin' size={19} />
					) : null}
					Войти
				</button>
			</form>
		</main>
	)
}
