import { useUser } from '@clerk/clerk-react'

export default function DashboardPage() {
  const { user } = useUser()
  const rawName = user?.username || user?.firstName || user?.fullName || 'there'
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

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
