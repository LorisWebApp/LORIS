import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  UserRound,
  LogOut,
  BookOpen,
  ArrowUpRight,
  Clock,
  ShieldCheck,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'

interface DashboardStats {
  organisations: number
  users: number
  pending_requests: number
}

function Dashboard() {
  const { profile, signOut, loading: authLoading } = useAuth()

  const managerName = profile?.full_name?.trim() || 'Platform Manager'

  // Dashboard statistics
  const [organisationCount, setOrganisationCount] = useState<number | null>(null)
  const [userCount, setUserCount] = useState<number | null>(null)
  const [pendingRequestCount, setPendingRequestCount] = useState<number | null>(null)

  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Fetch dashboard statistics after authentication has finished loading
  useEffect(() => {
    if (authLoading) return

    const fetchDashboardStats = async () => {
      setLoadingStats(true)
      setStatsError(null)

      try {
        // Check the current authenticated session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession()
        
        console.log('SESSION CHECK:', sessionData.session)
        console.log('SESSION ERROR:', sessionError)  

        if (sessionError) {
          throw sessionError
        }

        const session = sessionData.session

        if (!session) {
          throw new Error('No authenticated session found.')
        }

        // Fetch statistics from the secure Supabase function
        const { data, error } = await supabase.rpc(
          'get_platform_dashboard_stats'
        )

        if (error) {
          throw error
        }

        const stats = data as DashboardStats

        setOrganisationCount(stats.organisations)
        setUserCount(stats.users)
        setPendingRequestCount(stats.pending_requests)

      } catch (error) {
        console.error('Error fetching dashboard statistics:', error)
        setStatsError('Unable to load dashboard statistics.')
      } finally {
        setLoadingStats(false)
      }
    }

    fetchDashboardStats()
  }, [authLoading])

  // Display statistic values
  const displayCount = (count: number | null) => {
    if (authLoading || loadingStats) return '...'
    return count?.toLocaleString() ?? '--'
  }

  return (
    <div className="min-h-screen bg-[#082F2A] text-white">

      {/* Navigation Bar */}
      <nav className="bg-[#F8FAF9] text-[#0B3D36] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

          {/* Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#0B3D36] p-3 rounded-xl">
              <BookOpen size={28} className="text-white" />
            </div>

            <span className="text-3xl font-serif font-bold tracking-tight">
              LORIS
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">

            <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0B3D36] text-white font-medium whitespace-nowrap">
              <LayoutDashboard size={20} />
              Dashboard
            </button>

            <button className="flex items-center gap-2 px-4 py-3 text-[#0B3D36] hover:bg-gray-100 rounded-xl transition-colors whitespace-nowrap">
              <Building2 size={20} />
              Organisations
            </button>

            <button className="flex items-center gap-2 px-4 py-3 text-[#0B3D36] hover:bg-gray-100 rounded-xl transition-colors whitespace-nowrap">
              <Users size={20} />
              Users
            </button>

            <button className="flex items-center gap-2 px-4 py-3 text-[#0B3D36] hover:bg-gray-100 rounded-xl transition-colors whitespace-nowrap">
              <Activity size={20} />
              Activity
            </button>

            <button className="flex items-center gap-2 px-4 py-3 text-[#0B3D36] hover:bg-gray-100 rounded-xl transition-colors whitespace-nowrap">
              <UserRound size={20} />
              Profile
            </button>

            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 text-[#0B3D36] hover:bg-gray-100 rounded-xl transition-colors ml-2 whitespace-nowrap"
            >
              <LogOut size={20} />
              Sign out
            </button>

          </div>
        </div>
      </nav>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10">

        {/* Welcome Section */}
        <section className="mb-10">
          <p className="text-[#A8E6D4] uppercase tracking-[0.2em] text-sm font-semibold mb-3">
            Platform Administration
          </p>

          <h1 className="text-4xl font-serif font-medium tracking-tight">
            Welcome back, {managerName}.
          </h1>

          <p className="text-gray-300 text-lg sm:text-xl mt-5 max-w-3xl leading-relaxed">
            Here's an overview of the LORIS platform. Monitor organisations, users,
            registration requests, and platform activity from one place.
          </p>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">

          {/* Organisations */}
          <div className="bg-[#123F38] border border-[#315C53] rounded-2xl p-6 hover:border-[#A8E6D4] transition-colors">
            <div className="flex items-start justify-between">
              <p className="text-[#B5CFC8] text-sm font-semibold uppercase tracking-wide">
                Registered Organisations
              </p>

              <div className="p-3 bg-[#1D5045] rounded-xl">
                <Building2 size={22} className="text-[#A8E6D4]" />
              </div>
            </div>

            <h2 className="text-4xl font-serif mt-5">
              {displayCount(organisationCount)}
            </h2>

            <p className="text-[#A8E6D4] mt-2 text-sm">
              Organisations on LORIS
            </p>
          </div>

          {/* Users */}
          <div className="bg-[#123F38] border border-[#315C53] rounded-2xl p-6 hover:border-[#A8E6D4] transition-colors">
            <div className="flex items-start justify-between">
              <p className="text-[#B5CFC8] text-sm font-semibold uppercase tracking-wide">
                Total Users
              </p>

              <div className="p-3 bg-[#1D5045] rounded-xl">
                <Users size={22} className="text-[#A8E6D4]" />
              </div>
            </div>

            <h2 className="text-4xl font-serif mt-5">
              {displayCount(userCount)}
            </h2>

            <p className="text-[#A8E6D4] mt-2 text-sm">
              Registered platform users
            </p>
          </div>

          {/* Pending Requests */}
          <div className="bg-[#123F38] border border-[#315C53] rounded-2xl p-6 hover:border-[#F6C98B] transition-colors">
            <div className="flex items-start justify-between">
              <p className="text-[#B5CFC8] text-sm font-semibold uppercase tracking-wide">
                Pending Requests
              </p>

              <div className="p-3 bg-[#50432D] rounded-xl">
                <Clock size={22} className="text-[#F6C98B]" />
              </div>
            </div>

            <h2 className="text-4xl font-serif mt-5">
              {displayCount(pendingRequestCount)}
            </h2>

            <p className="text-[#F6C98B] mt-2 text-sm">
              Awaiting review
            </p>
          </div>

        </section>

        {/* Error Message */}
        {statsError && (
          <div className="mb-8 bg-red-900/30 border border-red-500/40 rounded-xl p-4 text-red-200">
            {statsError}
          </div>
        )}

        {/* Lower Dashboard Sections */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Platform Overview */}
          <div className="lg:col-span-2 bg-[#123F38] border border-[#315C53] rounded-2xl p-7">

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#1D5045] rounded-xl">
                <ShieldCheck size={24} className="text-[#A8E6D4]" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">Platform Overview</h2>
                <p className="text-[#B5CFC8] text-sm">
                  General platform information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="bg-[#0B342E] rounded-xl p-5">
                <p className="text-[#B5CFC8] text-sm">
                  Platform Name
                </p>

                <p className="text-xl font-semibold mt-2">
                  LORIS
                </p>
              </div>

              <div className="bg-[#0B342E] rounded-xl p-5">
                <p className="text-[#B5CFC8] text-sm">
                  System Status
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2.5 h-2.5 bg-[#75D6AC] rounded-full"></span>

                  <p className="text-xl font-semibold">
                    Operational
                  </p>
                </div>
              </div>

              <div className="bg-[#0B342E] rounded-xl p-5">
                <p className="text-[#B5CFC8] text-sm">
                  Platform Administrator
                </p>

                <p className="text-lg font-semibold mt-2">
                  {managerName}
                </p>
              </div>

              <div className="bg-[#0B342E] rounded-xl p-5">
                <p className="text-[#B5CFC8] text-sm">
                  Platform Access
                </p>

                <p className="text-lg font-semibold mt-2">
                  Administrator
                </p>
              </div>

            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#123F38] border border-[#315C53] rounded-2xl p-7">

            <h2 className="text-xl font-semibold mb-2">
              Quick Actions
            </h2>

            <p className="text-[#B5CFC8] text-sm mb-6">
              Common platform management tasks
            </p>

            <div className="space-y-3">

              <button className="w-full flex items-center justify-between bg-[#0B342E] hover:bg-[#1D5045] rounded-xl p-4 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <Building2 size={20} className="text-[#A8E6D4]" />

                  <span>Manage Organisations</span>
                </div>

                <ArrowUpRight size={18} className="text-[#B5CFC8]" />
              </button>

              <button className="w-full flex items-center justify-between bg-[#0B342E] hover:bg-[#1D5045] rounded-xl p-4 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-[#A8E6D4]" />

                  <span>Manage Users</span>
                </div>

                <ArrowUpRight size={18} className="text-[#B5CFC8]" />
              </button>

              <button className="w-full flex items-center justify-between bg-[#0B342E] hover:bg-[#1D5045] rounded-xl p-4 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <Activity size={20} className="text-[#F6C98B]" />

                  <span>Review Requests</span>
                </div>

                <ArrowUpRight size={18} className="text-[#B5CFC8]" />
              </button>

            </div>

            <div className="mt-6 pt-5 border-t border-[#315C53]">
              <p className="text-xs text-[#B5CFC8] leading-relaxed">
                Quick action links will become available as platform management
                modules are implemented.
              </p>
            </div>

          </div>

        </section>

      </main>

    </div>
  )
}

export default Dashboard