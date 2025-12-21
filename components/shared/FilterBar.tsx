import { ReactNode } from 'react'

export function FilterBar({ children }: { children: ReactNode }) {
	return (
		<div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6 items-end">
			{children}
		</div>
	)
}






