import { ROUTES } from '../../routes'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '../../components/ui'

/**
 * Trainer Dashboard Page
 * Modern dashboard for trainers with earnings, bookings, and business metrics
 */
const TrainerDashboard = () => {
  const { user } = useAuth()

  // Mock data - will be replaced with real API data
  const stats = {
    totalEarnings: 3850,
    thisMonth: 1250,
    upcomingSessions: 8,
    totalClients: 24,
    profileViews: 156,
    averageRating: 4.8,
  }

  const upcomingSessions = [
    {
      id: 1,
      client: 'John Smith',
      type: 'Personal Training',
      date: 'Today',
      time: '2:00 PM',
      duration: '60 min',
      earnings: '$75',
    },
    {
      id: 2,
      client: 'Emma Wilson',
      type: 'Yoga Session',
      date: 'Today',
      time: '5:00 PM',
      duration: '45 min',
      earnings: '$60',
    },
    {
      id: 3,
      client: 'Michael Brown',
      type: 'HIIT Training',
      date: 'Tomorrow',
      time: '7:00 AM',
      duration: '60 min',
      earnings: '$75',
    },
  ]

  const recentActivity = [
    { id: 1, action: 'New booking from Sarah Johnson', time: '2 hours ago', type: 'booking' },
    { id: 2, action: 'Profile viewed 12 times', time: '5 hours ago', type: 'view' },
    { id: 3, action: 'Received 5-star review from Mike Chen', time: '1 day ago', type: 'review' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user.username}! 💪
          </h1>
          <p className="text-lg text-gray-600">
            Grow your business and manage your training sessions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Earnings Card - Highlighted */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-forest-500 to-forest-600 text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-forest-100 text-sm font-medium mb-1">Total Earnings</p>
                <p className="text-5xl font-bold mb-1">${stats.totalEarnings.toLocaleString()}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <div>
                    <p className="text-forest-100 text-xs">This Month</p>
                    <p className="text-xl font-semibold">${stats.thisMonth.toLocaleString()}</p>
                  </div>
                  <div className="h-8 w-px bg-white/30"></div>
                  <div>
                    <p className="text-forest-100 text-xs">Average/Session</p>
                    <p className="text-xl font-semibold">${(stats.totalEarnings / 51).toFixed(0)}</p>
                  </div>
                </div>
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Profile Stats */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-sm font-medium mb-1">Profile Views</p>
                  <p className="text-4xl font-bold">{stats.profileViews}</p>
                  <p className="text-primary-100 text-xs mt-1">This week</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-accent-100 text-sm font-medium mb-1">Rating</p>
                  <div className="flex items-center">
                    <p className="text-4xl font-bold mr-2">{stats.averageRating}</p>
                    <span className="text-2xl">⭐</span>
                  </div>
                  <p className="text-accent-100 text-xs mt-1">24 reviews</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Upcoming Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.upcomingSessions}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
              <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">98%</p>
              </div>
              <div className="w-12 h-12 bg-forest-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Today's Schedule</CardTitle>
                  <Button to={ROUTES.TRAINER_BOOKINGS} variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                          {session.client.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{session.client}</h4>
                          <p className="text-sm text-gray-600">{session.type} • {session.duration}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="primary" className="mb-1">{session.time}</Badge>
                        <p className="text-sm font-medium text-forest-600">{session.earnings}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Button to={ROUTES.TRAINER_PROFILE_CREATE} variant="primary" className="justify-start">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Button>
              <Button to={ROUTES.TRAINER_AVAILABILITY} variant="outline" className="justify-start">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Set Availability
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'booking' ? 'bg-primary-500' :
                        activity.type === 'review' ? 'bg-accent-500' :
                        'bg-gray-400'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">✨</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Profile Status</h4>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">85% Complete</span>
                        <span className="text-primary-600 font-medium">Good!</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Add 2 more photos to reach 100%
                    </p>
                    <Button to={ROUTES.TRAINER_PROFILE_CREATE} size="sm" variant="primary">
                      Complete Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainerDashboard
