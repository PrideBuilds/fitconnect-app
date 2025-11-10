import { useAuth } from '../../contexts/AuthContext'

/**
 * Client Profile Page
 * View and edit client profile
 */
const ClientProfile = () => {
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Username</label>
              <p className="text-gray-900">{user.username}</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Email</label>
              <p className="text-gray-900">{user.email}</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Role</label>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {user.role}
              </span>
            </div>

            {user.phone && (
              <div>
                <label className="block text-gray-700 font-medium mb-1">Phone</label>
                <p className="text-gray-900">{user.phone}</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Profile editing functionality will be available soon.
          </p>
          <button
            disabled
            className="bg-gray-400 text-white px-6 py-2 rounded-lg cursor-not-allowed"
          >
            Edit Profile (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientProfile
