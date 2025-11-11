'use client'

import { SessionProvider } from 'next-auth/react'
import { NotificationProvider } from '@/providers/NotificationProvider'

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </SessionProvider>
  )
}