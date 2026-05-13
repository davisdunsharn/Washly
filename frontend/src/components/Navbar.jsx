import { UserButton, SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-[#EEF4FF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="font-bold text-xl text-blue-600">
            Washly
          </Link>
          <div className="flex items-center gap-4">
            <SignedIn>
              <Link to="/machines" className="text-gray-600 hover:text-gray-900">
                Machines
              </Link>
              <Link to="/bookings" className="text-gray-600 hover:text-gray-900">
                My Bookings
              </Link>
              <UserButton afterSignOutUrl="/dashboard" />
            </SignedIn>

            <SignedOut>
              <div className="flex gap-4">
                <SignInButton mode="modal">
                  <button className="text-blue-600 font-medium hover:text-blue-700">
                    Sign In
                  </button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  )
}
