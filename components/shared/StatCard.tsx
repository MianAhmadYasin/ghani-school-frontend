import { Card, CardContent } from '@/components/ui/card'
import { ReactNode } from 'react'

interface StatCardProps {
	icon: ReactNode
	label: string
	value: ReactNode
	className?: string
}

export function StatCard({ icon, label, value, className }: StatCardProps) {
	return (
		<Card className={className}>
			<CardContent className="p-6">
				<div className="flex items-center">
					{icon}
					<div className="ml-4">
						<p className="text-sm font-medium text-gray-600">{label}</p>
						<p className="text-2xl font-bold text-gray-900">{value}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}






