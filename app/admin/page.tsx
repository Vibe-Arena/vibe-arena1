'use client'

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  CircleDot,
  Clock3,
  Flag,
  Gavel,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Swords,
  UserRound,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from './admin.module.css'

type Tab = 'overview' | 'users' | 'matches' | 'flags'

type AdminStats = {
  totalUsers: number
  totalMatches: number
  activeMatches: number
  totalFlags: number
}

type AdminUser = {
  id: string
  username?: string | null
  email?: string | null
  created_at?: string | null
  is_suspended?: boolean | null
}

type AdminMatch = {
  id: string
  status?: string | null
  prompt?: string | null
  created_at?: string | null
}

type AdminFlag = {
  id: string
  type?: string | null
  description?: string | null
  created_at?: string | null
  resolved?: boolean | null
}

const tabs: Array<{
  id: Tab
  label: string
  icon: LucideIcon
}> = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'matches', label: 'Matches', icon: Swords },
  { id: 'flags', label: 'Reports', icon: Flag },
]

const initialStats: AdminStats = {
  totalUsers: 0,
  totalMatches: 0,
  activeMatches: 0,
  totalFlags: 0,
}

export default function AdminPage() {
  const router = useRouter()

  const [authorized, setAuthorized] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [stats, setStats] = useState<AdminStats>(initialStats)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [matches, setMatches] = useState<AdminMatch[]>([])
  const [flags, setFlags] = useState<AdminFlag[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        router.push('/dashboard')
        return
      }

      setAuthorized(true)
      await loadAll()
      setLoading(false)
    }

    init()
  }, [router])

  async function loadAll() {
    setRefreshing(true)
    setError('')

    const [
      usersCount,
      matchesCount,
      activeCount,
      flagsCount,
      usersData,
      matchesData,
      flagsData,
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('flags')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false),
      supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('flags')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false }),
    ])

    const failedRequest =
      usersCount.error ||
      matchesCount.error ||
      activeCount.error ||
      flagsCount.error ||
      usersData.error ||
      matchesData.error ||
      flagsData.error

    if (failedRequest) {
      setError(failedRequest.message)
    }

    setStats({
      totalUsers: usersCount.count || 0,
      totalMatches: matchesCount.count || 0,
      activeMatches: activeCount.count || 0,
      totalFlags: flagsCount.count || 0,
    })

    setUsers((usersData.data || []) as AdminUser[])
    setMatches((matchesData.data || []) as AdminMatch[])
    setFlags((flagsData.data || []) as AdminFlag[])
    setLastUpdated(new Date())
    setRefreshing(false)
  }

  async function suspendUser(id: string, state?: boolean | null) {
    setError('')

    const { error: updateError } = await supabase
      .from('users')
      .update({ is_suspended: !state })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await loadAll()
  }

  async function resolveFlag(id: string) {
    setError('')

    const { error: updateError } = await supabase
      .from('flags')
      .update({ resolved: true })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await loadAll()
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return users
    }

    return users.filter((user) => {
      const username = user.username?.toLowerCase() || ''
      const email = user.email?.toLowerCase() || ''
      return username.includes(query) || email.includes(query)
    })
  }, [search, users])

  const suspendedUsers = users.filter((user) => user.is_suspended).length
  const completionRate = stats.totalMatches
    ? Math.round(((stats.totalMatches - stats.activeMatches) / stats.totalMatches) * 100)
    : 0

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingCard}>
          <Activity className={styles.loadingIcon} size={28} />
          <strong>Loading admin console</strong>
          <span>Checking permissions and pulling live operations data.</span>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <Shield size={22} />
          </div>
          <div>
            <strong>Vibe Arena</strong>
            <span>Admin Console</span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Admin sections">
          {tabs.map((item) => {
            const Icon = item.icon

            return (
              <button
                className={`${styles.navItem} ${tab === item.id ? styles.navItemActive : ''}`}
                key={item.id}
                onClick={() => setTab(item.id)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.id === 'flags' && stats.totalFlags > 0 ? (
                  <strong className={styles.navBadge}>{stats.totalFlags}</strong>
                ) : null}
              </button>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <span>Signed in as admin</span>
          <button type="button" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={16} />
            Back to app
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>Operations</p>
            <h1>{getPageTitle(tab)}</h1>
            <span>
              {lastUpdated
                ? `Last updated ${lastUpdated.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Live database snapshot'}
            </span>
          </div>

          <div className={styles.topbarActions}>
            <button
              className={styles.secondaryButton}
              disabled={refreshing}
              onClick={loadAll}
              type="button"
            >
              <RefreshCw size={16} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        </header>

        {error ? (
          <div className={styles.errorBanner} role="alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        {tab === 'overview' ? (
          <section className={styles.stack}>
            <div className={styles.metricGrid}>
              <MetricCard
                icon={Users}
                label="Total users"
                value={stats.totalUsers}
                detail={`${suspendedUsers} suspended`}
                tone="blue"
              />
              <MetricCard
                icon={Swords}
                label="Total matches"
                value={stats.totalMatches}
                detail={`${completionRate}% completed`}
                tone="green"
              />
              <MetricCard
                icon={CircleDot}
                label="Live matches"
                value={stats.activeMatches}
                detail="Currently in progress"
                tone="orange"
              />
              <MetricCard
                icon={Flag}
                label="Open reports"
                value={stats.totalFlags}
                detail={stats.totalFlags > 0 ? 'Needs review' : 'Queue is clear'}
                tone="red"
              />
            </div>

            <div className={styles.overviewGrid}>
              <section className={styles.panel}>
                <PanelHeader
                  icon={Activity}
                  kicker="Platform health"
                  title="System status"
                  action="Operational"
                />
                <div className={styles.healthList}>
                  <HealthItem label="Authentication" value="Online" status="good" />
                  <HealthItem label="Matchmaking" value="Tracking" status="good" />
                  <HealthItem
                    label="Moderation queue"
                    value={stats.totalFlags > 0 ? `${stats.totalFlags} open` : 'Clear'}
                    status={stats.totalFlags > 0 ? 'warn' : 'good'}
                  />
                </div>
              </section>

              <section className={styles.panel}>
                <PanelHeader
                  icon={Clock3}
                  kicker="Recent activity"
                  title="Latest matches"
                  action={`${matches.length} loaded`}
                />
                <div className={styles.compactList}>
                  {matches.slice(0, 5).map((match) => (
                    <MatchLine key={match.id} match={match} />
                  ))}
                  {!matches.length ? <EmptyState label="No matches found." /> : null}
                </div>
              </section>
            </div>
          </section>
        ) : null}

        {tab === 'users' ? (
          <section className={styles.panel}>
            <PanelHeader
              icon={UserRound}
              kicker="Identity"
              title="User management"
              action={`${filteredUsers.length} shown`}
            />

            <label className={styles.searchBox}>
              <Search size={18} />
              <input
                placeholder="Search by username or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>User</span>
                <span>Joined</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {filteredUsers.map((user) => (
                <div className={styles.tableRow} key={user.id}>
                  <div className={styles.identityCell}>
                    <div className={styles.avatar}>{getInitials(user.username || user.email)}</div>
                    <div>
                      <strong>{user.username || 'Unknown user'}</strong>
                      <span>{user.email || 'No email on record'}</span>
                    </div>
                  </div>
                  <span>{formatDate(user.created_at)}</span>
                  <StatusPill
                    label={user.is_suspended ? 'Suspended' : 'Active'}
                    tone={user.is_suspended ? 'danger' : 'success'}
                  />
                  <button
                    className={user.is_suspended ? styles.restoreButton : styles.dangerButton}
                    onClick={() => suspendUser(user.id, user.is_suspended)}
                    type="button"
                  >
                    {user.is_suspended ? <BadgeCheck size={16} /> : <ShieldAlert size={16} />}
                    {user.is_suspended ? 'Restore' : 'Suspend'}
                  </button>
                </div>
              ))}

              {!filteredUsers.length ? <EmptyState label="No users match that search." /> : null}
            </div>
          </section>
        ) : null}

        {tab === 'matches' ? (
          <section className={styles.panel}>
            <PanelHeader
              icon={Swords}
              kicker="Arena"
              title="Match history"
              action={`${matches.length} recent`}
            />

            <div className={styles.matchList}>
              {matches.map((match) => (
                <article className={styles.matchCard} key={match.id}>
                  <div className={styles.matchMeta}>
                    <StatusPill
                      label={match.status || 'unknown'}
                      tone={match.status === 'active' ? 'warning' : 'neutral'}
                    />
                    <span>{formatDate(match.created_at)}</span>
                  </div>
                  <p>{match.prompt || 'No prompt was saved for this match.'}</p>
                </article>
              ))}

              {!matches.length ? <EmptyState label="No matches found." /> : null}
            </div>
          </section>
        ) : null}

        {tab === 'flags' ? (
          <section className={styles.panel}>
            <PanelHeader
              icon={Gavel}
              kicker="Moderation"
              title="Open reports"
              action={`${flags.length} pending`}
            />

            <div className={styles.reportList}>
              {flags.map((flag) => (
                <article className={styles.reportCard} key={flag.id}>
                  <div>
                    <div className={styles.reportTopline}>
                      <StatusPill label={flag.type || 'Report'} tone="danger" />
                      <span>{formatDate(flag.created_at)}</span>
                    </div>
                    <p>{flag.description || 'No report description provided.'}</p>
                  </div>
                  <button
                    className={styles.primaryButton}
                    onClick={() => resolveFlag(flag.id)}
                    type="button"
                  >
                    <CheckCircle2 size={16} />
                    Resolve
                  </button>
                </article>
              ))}

              {!flags.length ? <EmptyState label="No open reports. Moderation queue is clear." /> : null}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string
  icon: LucideIcon
  label: string
  tone: 'blue' | 'green' | 'orange' | 'red'
  value: number
}) {
  return (
    <article className={`${styles.metricCard} ${styles[`metric-${tone}`]}`}>
      <div className={styles.metricIcon}>
        <Icon size={20} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value.toLocaleString()}</strong>
        <p>{detail}</p>
      </div>
    </article>
  )
}

function PanelHeader({
  action,
  icon: Icon,
  kicker,
  title,
}: {
  action: string
  icon: LucideIcon
  kicker: string
  title: string
}) {
  return (
    <div className={styles.panelHeader}>
      <div>
        <span className={styles.panelKicker}>
          <Icon size={16} />
          {kicker}
        </span>
        <h2>{title}</h2>
      </div>
      <strong>{action}</strong>
    </div>
  )
}

function HealthItem({
  label,
  status,
  value,
}: {
  label: string
  status: 'good' | 'warn'
  value: string
}) {
  return (
    <div className={styles.healthItem}>
      <span className={`${styles.statusDot} ${styles[status]}`} />
      <div>
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
    </div>
  )
}

function MatchLine({ match }: { match: AdminMatch }) {
  return (
    <div className={styles.matchLine}>
      <StatusPill
        label={match.status || 'unknown'}
        tone={match.status === 'active' ? 'warning' : 'neutral'}
      />
      <span>{match.prompt || 'No prompt saved'}</span>
      <small>{formatDate(match.created_at)}</small>
    </div>
  )
}

function StatusPill({
  label,
  tone,
}: {
  label: string
  tone: 'danger' | 'neutral' | 'success' | 'warning'
}) {
  return <span className={`${styles.statusPill} ${styles[tone]}`}>{label}</span>
}

function EmptyState({ label }: { label: string }) {
  return <div className={styles.emptyState}>{label}</div>
}

function getPageTitle(tab: Tab) {
  const titles: Record<Tab, string> = {
    overview: 'Command center',
    users: 'Users',
    matches: 'Matches',
    flags: 'Reports',
  }

  return titles[tab]
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Unknown'
  }

  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getInitials(value?: string | null) {
  if (!value) {
    return 'VA'
  }

  return value
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
