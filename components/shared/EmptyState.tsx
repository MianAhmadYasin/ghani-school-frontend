import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReactNode } from 'react'

interface EmptyStateProps {
	icon?: ReactNode
	title: string
	description?: string
	actionLabel?: string
	onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
	return (
		<Card>
			<CardContent className="p-12 text-center text-gray-500">
				{icon}
				<p className="text-lg font-medium mb-2">{title}</p>
				{description && <p className="mb-4">{description}</p>}
				{actionLabel && onAction && (
					<Button variant="outline" onClick={onAction}>{actionLabel}</Button>
				)}
			</CardContent>
		</Card>
	)
}






