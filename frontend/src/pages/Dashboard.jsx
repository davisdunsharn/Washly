import { useEffect } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'

export default function DashboardPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const rawName = user?.username || user?.firstName || user?.fullName || 'there'
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  useEffect(() => {
    const syncUserToDatabase = async () => {
      try {
        const clerkToken = await getToken()
        const response = await fetch('http://localhost:3000/api/users/sync', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${clerkToken}`,
            'Content-Type': 'application/json'
          }
        })
        const data = await response.json()
        console.log('User synced:', data)
      } catch (error) {
        console.error('Failed to sync user:', error)
      }
    }

    if (user) {
      syncUserToDatabase()
    }
  }, [user, getToken])

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
        <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-8">
          {user
            ? 'Your laundry booking interface is coming soon. This is where your machine status, bookings, and notifications will appear.'
            : 'Smart Laundry Booking & Tracking System'}
        </p>
      </main>
    </div>
  )
}
