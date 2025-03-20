import React from 'react'
import { useEffect } from "react"
function Home() {

    // This helps prevent body scrolling behind the main container
  useEffect(() => {
    // Lock body scrolling
    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.width = "100%"
    document.body.style.height = "100%"

    return () => {
      // Restore body scrolling when component unmounts
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.width = ""
      document.body.style.height = ""
    }
  }, [])
  return (
    <div className="fixed inset-0 w-full h-full">
      <div
        className="w-full h-full overflow-y-auto overscroll-none"
        style={{
          WebkitOverflowScrolling: "touch",
          overflowScrolling: "touch",
        }}
      >
        <div className="flex flex-col items-center min-h-full">
          {/* Logo Section - Fixed height */}
          <div className="w-full h-[55vh] flex items-center justify-center bg-gray-400">
            <div className="flex items-center justify-center h-60 w-60 bg-white rounded-full ring-4 ring-white shadow-lg">
              <span className="text-3xl font-bold text-gray-800">CleanRoute</span>
            </div>
          </div>

          {/* Login Button Section - Fixed height */}
          <div className="w-full py-4 flex items-center justify-center bg-gray-400">
            <button className="h-12 px-8 text-lg font-medium bg-white text-amber-600 active:bg-amber-100 transition duration-0 rounded">
              Login
            </button>
          </div>

          {/* Sign Up Section - Fixed height */}
          <div className="w-full py-4 flex items-center justify-center bg-gray-400">
            <p className="text-white">
              Don't have an account? <button className="font-medium text-amber-300 active:underline">Sign Up</button>
            </p>
          </div>

          {/* What is CleanRoute Section - Larger with min-height */}
          <div className="flex w-full bg-amber-950 min-h-[70vh]">
            <div className="w-full max-w-4xl mx-auto px-6 py-16">
              <h2 className="text-2xl font-bold text-amber-100 mb-6">What is CleanRoute?</h2>

              {/* Added content to demonstrate scrolling */}
              <div className="text-amber-100 space-y-4">
                <p>
                  CleanRoute is an innovative platform designed to help users navigate their daily commutes more
                  efficiently and sustainably.
                </p>
                <p>
                  Our mission is to reduce traffic congestion and environmental impact by providing smart routing
                  solutions that optimize travel time while minimizing carbon footprint.
                </p>
                <p>With CleanRoute, you can:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Find the most efficient routes for your daily commute</li>
                  <li>Discover alternative transportation options</li>
                  <li>Track your carbon savings over time</li>
                  <li>Join a community of environmentally conscious commuters</li>
                  <li>Earn rewards for sustainable travel choices</li>
                </ul>
                <p>
                  Our advanced algorithms analyze real-time traffic data, weather conditions, and public transportation
                  schedules to suggest the optimal route for your journey.
                </p>
                <p>
                  Whether you're driving, cycling, walking, or using public transport, CleanRoute helps you make
                  informed decisions that benefit both you and the planet.
                </p>
                <p>
                  Join thousands of users who have already reduced their commute times and environmental impact with
                  CleanRoute.
                </p>
                <p>Download our app today and start experiencing cleaner, more efficient routes!</p>
                <p>CleanRoute is available on iOS and Android devices, with web access coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home