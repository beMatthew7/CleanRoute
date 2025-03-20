"use client"

import { ChevronLeftIcon, ChevronRightIcon, UserIcon, BellIcon, LockKeyholeIcon, GlobeIcon, PictureInPicture2Icon, DatabaseIcon, CircleHelpIcon, MonitorSmartphoneIcon } from "lucide-react"

function Settings() {
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-400">
      {/* Fixed header */}
      <nav className="text-lg font-medium bg-gray-400 w-full z-20 shadow-lg flex items-center justify-center p-3">
        <button className="absolute left-2">
          <ChevronLeftIcon />
        </button>
        <div>Settings</div>
      </nav>

      {/* Scrollable content - optimized for iOS and Android */}
      <div
        className="flex-1 overflow-y-auto pb-6 overscroll-none"
        style={{
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          overscrollBehavior: "contain", // For Android
        }}
      >
        {/* Hide scrollbar in WebKit browsers */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div className="max-w-md mx-auto mt-5 bg-white rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200">
            {/* Account */}
            <li className="flex items-center p-4 hover:bg-gray-100 active:bg-gray-200 touch-manipulation cursor-pointer">
              <MonitorSmartphoneIcon className="h-6 w-6 text-blue-500" />
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium">Linked Devices</p>
                <p className="text-xs text-gray-500">See linked Devices, link a device</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </li>

            {/* Notifications */}
            <li className="flex items-center p-4 hover:bg-gray-100 active:bg-gray-200 touch-manipulation cursor-pointer">
              <BellIcon className="h-6 w-6 text-red-500" />
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-gray-500">Message and call tones</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </li>

            {/* Security */}
            <li className="flex items-center p-4 hover:bg-gray-100 active:bg-gray-200 touch-manipulation cursor-pointer">
              <LockKeyholeIcon className="h-6 w-6 text-green-500" />
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium">Security</p>
                <p className="text-xs text-gray-500">Enable two-step verification</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </li>

            {/* Language */}
            <li className="flex items-center p-4 hover:bg-gray-100 active:bg-gray-200 touch-manipulation cursor-pointer">
              <GlobeIcon className="h-6 w-6 text-yellow-500" />
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium">Language</p>
                <p className="text-xs text-gray-500">Change app language</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </li>
          </ul>
        </div>

        {/* Additional sections for demonstration */}
        <div className="max-w-md mx-auto mt-4 bg-white rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200">
            <li className="flex items-center p-4 hover:bg-gray-100 active:bg-gray-200 touch-manipulation cursor-pointer">
              <PictureInPicture2Icon className="h-6 w-6 text-blue-500" />
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium">Display</p>
                <p className="text-xs text-gray-500">Theme, wallpaper, chat settings</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </li>

            <li className="flex items-center p-4 hover:bg-gray-100 active:bg-gray-200 touch-manipulation cursor-pointer">
              <DatabaseIcon className="h-6 w-6 text-red-500" />
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium">Storage</p>
                <p className="text-xs text-gray-500">Network usage, auto-download</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </li>

            <li className="flex items-center p-4 hover:bg-gray-100 active:bg-gray-200 touch-manipulation cursor-pointer">
              <LockKeyholeIcon className="h-6 w-6 text-green-500" />
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium">App Language</p>
                <p className="text-xs text-gray-500">English (device's language)</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </li>

            <li className="flex items-center p-4 hover:bg-gray-100 active:bg-gray-200 touch-manipulation cursor-pointer">
              <CircleHelpIcon className="h-6 w-6 text-yellow-500" />
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium">Help</p>
                <p className="text-xs text-gray-500">Help center, contact us, privacy policy</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </li>
          </ul>
        </div>

        <div className="max-w-md mx-auto mt-4 mb-4 bg-white rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200">
            <li className="flex items-center p-4 hover:bg-gray-100 active:bg-gray-200 touch-manipulation cursor-pointer">
              <UserIcon className="h-6 w-6 text-blue-500" />
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium">Invite a friend</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </li>

            <li className="flex items-center p-4 hover:bg-gray-100 active:bg-gray-200 touch-manipulation cursor-pointer bg-red-50">
              <BellIcon className="h-6 w-6 text-red-500" />
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-red-500">Log out</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Settings

