import { useState, useEffect } from 'react'
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  UserButton, 
  useUser,
  useAuth
} from '@clerk/clerk-react'

// 1. Import your newly created Stage 4 dashboard components
import HealthChart from './components/HealthChart'
import LoadingSkeleton from './components/LoadingSkeleton'

interface CommitItem {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface RepositoryItem {
  id: number;
  name: string;
  fullName: string;
  owner: string;
}

interface AIReportData {
  dailyStandup: {
    yesterday: string;
    today: string;
    blockers: string;
  };
  projectHealth: {
    complexityScore: number;
    summaryAnalysis: string;
    filesImpactedCount: number;
  };
}

export default function App() {
  return (
    <div className="min-h-screen bg-dark-bg text-white flex flex-col font-sans selection:bg-electric-blue selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-white/10 bg-dark-bg/50 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-electric-blue flex items-center justify-center font-bold text-dark-bg shadow-lg shadow-electric-blue/20">
            D
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            DevPulse
          </span>
        </div>
        
        <nav className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-electric-blue hover:opacity-90 text-dark-bg px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.98]">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-6xl w-full mx-auto p-6">
        <SignedOut>
          <div className="text-center max-w-xl space-y-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white/60">
              <span className="flex h-2 w-2 rounded-full bg-neon-green animate-pulse" />
              Phase 4 Visual Analytics Live
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Automated Status Reports for Modern Engineers
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              DevPulse connects to your development cycle, analyzes raw commit data using AI, and instantly formats standup reports and technical health summaries.
            </p>
            <div className="pt-4">
              <SignInButton mode="modal">
                <button className="bg-neon-green hover:opacity-90 text-dark-bg px-6 py-3 rounded-xl font-bold transition-all shadow-xl shadow-neon-green/10 active:scale-[0.98]">
                  Get Started for Free
                </button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <DashboardShell />
        </SignedIn>
      </main>
    </div>
  )
}

function DashboardShell() {
  const { user } = useUser()
  const { getToken } = useAuth()
  
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [loadingCommits, setLoadingCommits] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  
  const [myRepositories, setMyRepositories] = useState<RepositoryItem[]>([])
  const [selectedRepo, setSelectedRepo] = useState<RepositoryItem | null>(null)
  
  const [commits, setCommits] = useState<CommitItem[]>([])
  const [report, setReport] = useState<AIReportData | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  useEffect(() => {
    const loadUserRepositories = async () => {
      setLoadingRepos(true)
      try {
        const sessionToken = await getToken()
        const response = await fetch('http://localhost:5000/api/github/repos', {
          headers: { Authorization: `Bearer ${sessionToken}` }
        })
        const data = await response.json()
        if (data.success && data.repositories) {
          setMyRepositories(data.repositories)
          if (data.repositories.length > 0) {
            setSelectedRepo(data.repositories[0])
          }
        }
      } catch (error) {
        console.error('Error fetching repo array index:', error)
      } finally {
        setLoadingRepos(false)
      }
    }
    loadUserRepositories()
  }, [getToken])

  const fetchLiveCommits = async () => {
    if (!selectedRepo) return
    setLoadingCommits(true)
    setReport(null)
    try {
      const sessionToken = await getToken()
      const response = await fetch(
        `http://localhost:5000/api/github/commits?owner=${selectedRepo.owner}&repo=${selectedRepo.name}`,
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      const data = await response.json()
      if (data.success && data.commits) {
        setCommits(data.commits)
      }
    } catch (error) {
      console.error('Error fetching targeted commits:', error)
    } finally {
      setLoadingCommits(false)
    }
  }

 const generateAIReport = async () => {
  if (commits.length === 0 || !selectedRepo) return
  setAiLoading(true)
  try {
    const sessionToken = await getToken() // Grab the active Clerk JWT

    const response = await fetch('http://localhost:5000/api/ai/summarize', {
      method: 'POST',
      headers: {
        // ⚠️ CRITICAL: Capitalize "Authorization" and verify the space after Bearer
        'Authorization': `Bearer ${sessionToken}`, 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        repository: selectedRepo.fullName,
        commits: commits
      })
    })

    const data = await response.json()
    if (data.success && data.summary) {
      setReport(data.summary)
    }
  } catch (error) {
    console.error('Error matching token context:', error)
  } finally {
    setAiLoading(false)
  }
}

  const handleCopyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  return (
    <div className="w-full space-y-8 py-8 animate-in fade-in duration-500">
      
      {/* Control panel interface header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.firstName || 'Developer'} 👋
          </h2>
          
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Target Stream:</span>
            {loadingRepos ? (
              <span className="text-xs text-white/60 animate-pulse">Scanning repositories index...</span>
            ) : (
              <select
                className="bg-dark-bg border border-white/10 text-white/80 text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-electric-blue transition-colors"
                value={selectedRepo?.id || ''}
                onChange={(e) => {
                  const target = myRepositories.find(r => r.id === Number(e.target.value))
                  if (target) {
                    setSelectedRepo(target)
                    setCommits([])
                    setReport(null)
                  }
                }}
              >
                {myRepositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {/* Sync Controls */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            onClick={fetchLiveCommits}
            disabled={loadingCommits || !selectedRepo}
            className="bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          >
            {loadingCommits ? 'Syncing...' : 'Sync Live Pulse'}
          </button>

          {commits.length > 0 && (
            <button
              onClick={generateAIReport}
              disabled={aiLoading}
              className="bg-electric-blue hover:opacity-90 disabled:opacity-50 text-dark-bg px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-electric-blue/15 active:scale-[0.98]"
            >
              {aiLoading ? 'Analyzing Workspace...' : 'Generate AI Standup'}
            </button>
          )}
        </div>
      </div>

      {/* 2. Display the flash skeleton when background data stream is compiling */}
      {aiLoading && <LoadingSkeleton />}

      {/* --- LIVE INTERACTIVE AI DASHBOARD REPORT PANELS --- */}
      {report && !aiLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="lg:col-span-2 border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-electric-blue/10 rounded-xl text-electric-blue font-bold text-sm">📝</div>
                <h3 className="text-lg font-bold text-white">Automated Scrum Standup</h3>
              </div>
              <button 
                onClick={() => handleCopyToClipboard(
                  `Yesterday:\n${report.dailyStandup.yesterday}\n\nToday:\n${report.dailyStandup.today}\n\nBlockers:\n${report.dailyStandup.blockers}`, 
                  'all'
                )}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white font-medium transition-all"
              >
                {copiedSection === 'all' ? 'Copied! ✓' : 'Copy Full Sync'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-electric-blue mb-1">🚀 Accomplished Yesterday</h4>
                <div className="text-sm text-white/80 whitespace-pre-line leading-relaxed pl-1">
                  {report.dailyStandup.yesterday}
                </div>
              </div>
              <div className="pt-2 border-t border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neon-green mb-1">🎯 Projected Focus Today</h4>
                <div className="text-sm text-white/80 whitespace-pre-line leading-relaxed pl-1">
                  {report.dailyStandup.today}
                </div>
              </div>
              <div className="pt-2 border-t border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">⚠️ Flagged Blockers</h4>
                <div className="text-sm text-white/80 whitespace-pre-line leading-relaxed pl-1">
                  {report.dailyStandup.blockers}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Sidebar Container housing both the index cards and the new analytics chart */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-6 flex flex-col justify-between gap-6 flex-1">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
                  <div className="p-2 bg-neon-green/10 rounded-xl text-neon-green text-sm">📊</div>
                  <h3 className="text-lg font-bold text-white">Project Health Index</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium text-white/40">Code Volatility / Complexity</span>
                    <span className="text-xl font-black text-white">{report.projectHealth.complexityScore}<span className="text-xs text-white/40 font-normal">/100</span></span>
                  </div>
                  <div className="w-full h-2.5 bg-dark-bg rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="h-full bg-gradient-to-r from-neon-green to-electric-blue transition-all duration-500"
                      style={{ width: `${report.projectHealth.complexityScore}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <span className="text-xs font-medium text-white/40 block mb-1">Architecture Analysis</span>
                  <p className="text-sm text-white/80 leading-relaxed italic bg-dark-bg/40 border border-white/5 p-3 rounded-xl">
                    "{report.projectHealth.summaryAnalysis}"
                  </p>
                </div>
              </div>
              <div className="bg-dark-bg/60 rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between text-xs">
                <span className="text-white/60 font-medium">Distinct Modules Impacted:</span>
                <span className="font-mono text-neon-green font-bold bg-dark-bg border border-white/10 px-2 py-0.5 rounded">
                  {report.projectHealth.filesImpactedCount} files
                </span>
              </div>
            </div>

            {/* Render the structural Recharts dashboard element */}
            <HealthChart 
              complexityScore={report.projectHealth.complexityScore} 
              filesCount={report.projectHealth.filesImpactedCount} 
            />
          </div>
        </div>
      )}

      {/* Commit Stream Timeline Panel */}
      {commits.length > 0 && (
        <div className="border border-white/10 bg-white/5 rounded-2xl overflow-hidden backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="border-b border-white/10 px-6 py-4 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-electric-blue" />
              <h3 className="font-semibold text-white text-sm">Active Transaction Stream</h3>
            </div>
            <span className="font-mono text-xs bg-dark-bg text-electric-blue px-2.5 py-1 rounded-md border border-white/10">
              {selectedRepo?.fullName}
            </span>
          </div>
          
          <div className="divide-y divide-white/5">
            {commits.map((commit) => (
              <div key={commit.sha} className="p-5 hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-white line-clamp-1">
                    {commit.message.split('\n')[0]}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span className="font-medium text-white/60">{commit.author}</span>
                    <span>•</span>
                    <span>{new Date(commit.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                <a 
                  href={commit.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-mono text-xs bg-dark-bg text-neon-green border border-white/10 px-3 py-1.5 rounded-lg hover:border-neon-green/40 transition-all self-start sm:self-center"
                >
                  {commit.sha.substring(0, 7)}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}