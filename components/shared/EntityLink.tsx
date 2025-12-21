'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { ReactNode } from 'react'

interface EntityLinkProps {
  href: string
  children: ReactNode
  variant?: 'link' | 'button' | 'badge'
  className?: string
  external?: boolean
  onClick?: () => void
}

export function EntityLink({ 
  href, 
  children, 
  variant = 'link',
  className = '',
  external = false,
  onClick
}: EntityLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        asChild
        className={className}
        onClick={handleClick}
      >
        <Link href={href} target={external ? '_blank' : undefined}>
          {children}
          {external && <ExternalLink className="h-3 w-3 ml-1" />}
        </Link>
      </Button>
    )
  }

  if (variant === 'badge') {
    return (
      <Link 
        href={href} 
        className={`inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline ${className}`}
        onClick={handleClick}
      >
        {children}
        <ChevronRight className="h-3 w-3" />
      </Link>
    )
  }

  return (
    <Link 
      href={href}
      className={`text-blue-600 hover:text-blue-800 hover:underline ${className}`}
      onClick={handleClick}
    >
      {children}
    </Link>
  )
}









