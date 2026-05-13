import { SignIn } from '@clerk/clerk-react'

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <SignIn afterSignInUrl="/dashboard" />
    </div>
  )
}
