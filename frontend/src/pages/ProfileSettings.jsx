import { useAuth } from '../contexts/AuthContext'

/**
 * Profile Settings Page
 * Manage account settings and preferences
 */
const ProfileSettings = () => {
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <p className="text-gray-900">{user.email}</p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Username</label>
            <p className="text-gray-900">{user.username}</p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Account Type</label>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
        <p className="text-sm text-gray-500 mb-4">
          Password change functionality will be available soon.
        </p>
        <button
          disabled
          className="bg-gray-400 text-white px-6 py-2 rounded-lg cursor-not-allowed"
        >
          Change Password (Coming Soon)
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
        <p className="text-sm text-gray-500 mb-4">
          Manage your email and push notification preferences.
        </p>
        <button
          disabled
          className="bg-gray-400 text-white px-6 py-2 rounded-lg cursor-not-allowed"
        >
          Manage Notifications (Coming Soon)
        </button>
      </div>
    </div>
  )
}

export default ProfileSettings
