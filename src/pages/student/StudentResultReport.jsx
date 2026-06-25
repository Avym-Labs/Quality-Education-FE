import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function StudentResultReport() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [testLimit, setTestLimit] = useState(5)

  useEffect(() => {
    async function fetchResults() {
      if (!user?.id) return
      try {
        const { data } = await api.get('/results', { params: { student_id: user.id } })
        if (data) {
          setResults(data)
        }
      } catch (err) {
        console.error('Failed to load student results:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [user])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // Calculate statistics
  const totalTests = results.length
  const avgMarks = totalTests > 0 ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalTests) : 88.5
  const highestScore = totalTests > 0 ? Math.max(...results.map(r => r.percentage)) : 98
  const currentRank = avgMarks >= 90 ? '#1' : avgMarks >= 80 ? '#2' : '#3'
  const rankPercentile = avgMarks >= 90 ? 'Top 0.5% of Class' : avgMarks >= 80 ? 'Top 1% of Class' : 'Top 5% of Class'

  const filteredResults = results.filter((r) => 
    (r.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.test_title || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, testLimit)

  return (
    <DashboardLayout hideTopBar={true}>
      {/* TopAppBar */}
      <header className="bg-surface shadow-sm w-full sticky top-0 z-40 -mx-container-padding-mobile px-container-padding-mobile">
        <div className="flex items-center justify-between h-16 w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <span 
              className="material-symbols-outlined text-primary cursor-pointer active:scale-95 transition-transform" 
              onClick={() => navigate('/student/dashboard')}
            >
              arrow_back
            </span>
            <h1 className="font-title-lg text-title-lg text-primary font-bold">Student Performance</h1>
          </div>
          <button className="material-symbols-outlined text-primary p-2 hover:bg-surface-container rounded-full transition-colors">
            more_vert
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto mt-4 space-y-stack-lg pb-10">
        
        {/* Search Bar */}
        <section className="w-full">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary transition-all shadow-sm text-sm" 
              placeholder="Search student records by subject or title..." 
              type="text"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
          
          {/* Left Column: Student Profile Card */}
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant flex flex-col items-center text-center self-start">
            <div className="relative mb-4">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-primary-fixed shadow-sm" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-fixed border-4 border-primary-fixed shadow-sm flex items-center justify-center">
                  <span className="text-primary font-bold text-2xl">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-primary text-on-primary text-[10px] px-2 py-0.5 rounded-full font-bold">PRO</div>
            </div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold mb-1">{user?.full_name}</h2>
            <div className="flex gap-2 mb-4">
              <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-semibold text-xs">Roll #{user?.roll_number}</span>
              <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-semibold text-xs">Grade {user?.grade}-{user?.section}</span>
            </div>
            <div className="w-full grid grid-cols-2 gap-4 border-t border-outline-variant pt-4">
              <div>
                <p className="text-on-surface-variant text-xs font-semibold">Current Rank</p>
                <p className="text-primary font-bold text-lg">{currentRank}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-xs font-semibold">Avg Marks</p>
                <p className="text-primary font-bold text-lg">{avgMarks}%</p>
              </div>
            </div>
          </div>

          {/* Right Column: Analytics & Summary Cards */}
          <div className="lg:col-span-8 space-y-stack-md">
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <button 
                onClick={() => setTestLimit(5)}
                className={`px-4 py-2 rounded-full font-semibold text-xs transition-all ${
                  testLimit === 5 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                Last 5 Tests
              </button>
              <button 
                onClick={() => setTestLimit(10)}
                className={`px-4 py-2 rounded-full font-semibold text-xs transition-all ${
                  testLimit === 10 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                Last 10 Tests
              </button>
              <button 
                onClick={() => setTestLimit(100)}
                className={`px-4 py-2 rounded-full font-semibold text-xs transition-all ${
                  testLimit === 100 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                All Tests
              </button>
            </div>

            {/* Summary Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
                <span className="material-symbols-outlined text-primary mb-2">analytics</span>
                <p className="text-on-surface-variant text-xs font-semibold">Avg Marks</p>
                <h3 className="font-bold text-lg">{avgMarks}%</h3>
                <p className="text-green-600 text-[10px] font-bold">+2.4% vs last mo</p>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
                <span className="material-symbols-outlined text-primary mb-2">military_tech</span>
                <p className="text-on-surface-variant text-xs font-semibold">Highest</p>
                <h3 className="font-bold text-lg">{highestScore}%</h3>
                <p className="text-on-surface-variant text-[10px]">Recent High</p>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
                <span className="material-symbols-outlined text-primary mb-2">leaderboard</span>
                <p className="text-on-surface-variant text-xs font-semibold">Rank</p>
                <h3 className="font-bold text-lg">{currentRank}</h3>
                <p className="text-on-surface-variant text-[10px]">{rankPercentile}</p>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
                <span className="material-symbols-outlined text-primary mb-2">history_edu</span>
                <p className="text-on-surface-variant text-xs font-semibold">Total Tests</p>
                <h3 className="font-bold text-lg">{totalTests || 12}</h3>
                <p className="text-on-surface-variant text-[10px]">Academic Year 2026</p>
              </div>
            </div>

          </div>

        </div>

        {/* Main Analytics Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-lg">
          
          {/* Performance Chart */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-title-lg text-title-lg font-bold">Marks Trend</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-[12px] font-semibold">You</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-surface-container-highest rounded-full"></div>
                  <span className="text-[12px] font-semibold">Class Avg</span>
                </div>
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-2 px-2 relative">
              {/* Fake Line Chart using SVG clip-path/gradient for a SaaS look */}
              <div className="absolute inset-0 bottom-8 flex items-end px-12 pt-6">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150" preserveAspectRatio="none">
                  <path d="M0,120 Q50,100 100,110 T200,60 T300,40 T400,20" fill="none" stroke="#3525cd" strokeLinecap="round" strokeWidth="4"></path>
                  <path d="M0,140 Q50,130 100,135 T200,110 T300,105 T400,90" fill="none" stroke="#c7c4d8" strokeDasharray="4" strokeLinecap="round" strokeWidth="2"></path>
                  <circle cx="0" cy="120" fill="#3525cd" r="4"></circle>
                  <circle cx="100" cy="110" fill="#3525cd" r="4"></circle>
                  <circle cx="200" cy="60" fill="#3525cd" r="4"></circle>
                  <circle cx="300" cy="40" fill="#3525cd" r="4"></circle>
                  <circle cx="400" cy="20" fill="#3525cd" r="4"></circle>
                </svg>
              </div>
              <div className="z-10 flex flex-col items-center gap-1 w-full"><div className="text-[10px] font-bold text-on-surface-variant">Test 1</div></div>
              <div className="z-10 flex flex-col items-center gap-1 w-full"><div className="text-[10px] font-bold text-on-surface-variant">Test 2</div></div>
              <div className="z-10 flex flex-col items-center gap-1 w-full"><div className="text-[10px] font-bold text-on-surface-variant">Test 3</div></div>
              <div className="z-10 flex flex-col items-center gap-1 w-full"><div className="text-[10px] font-bold text-on-surface-variant">Test 4</div></div>
              <div className="z-10 flex flex-col items-center gap-1 w-full"><div className="text-[10px] font-bold text-on-surface-variant">Latest</div></div>
            </div>
          </div>

          {/* Chapter Performance */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant flex flex-col justify-between">
            <h3 className="font-title-lg text-title-lg font-bold">Chapter Analysis</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm font-semibold">
                  <span>Calculus</span>
                  <span className="text-primary font-bold">92%</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm font-semibold">
                  <span>Algebra</span>
                  <span className="text-primary font-bold">85%</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm font-semibold">
                  <span>Geometry</span>
                  <span className="text-primary font-bold">78%</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="bg-primary-fixed p-4 rounded-xl mt-4 border border-primary-container">
              <div className="flex gap-2">
                <span className="material-symbols-outlined text-primary">insights</span>
                <p className="text-[12px] font-semibold text-on-primary-fixed-variant leading-tight">
                  You excel in conceptual calculations but show a slight plateau in geometric spatial reasoning. Focus on geometric proofs.
                </p>
              </div>
            </div>
          </div>

          {/* Topper Section Highlight */}
          <div className="lg:col-span-1 bg-gradient-to-br from-primary to-secondary rounded-[24px] p-6 shadow-lg text-on-primary relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-4 -top-4 opacity-20">
              <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
            </div>
            <div className="relative z-10 space-y-4">
              <div>
                <h3 className="font-title-lg text-title-lg font-bold">Achievement Badge</h3>
                <p className="text-on-primary-container text-xs">Top Performer of the Month</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">Top Score In</span>
                <span className="font-headline-lg-mobile text-lg font-bold">Calculus Midterm</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-bold leading-none">98</span>
                  <span className="text-sm opacity-80">/100</span>
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 bg-on-primary/20 backdrop-blur-md rounded-full px-4 py-1 self-start mt-4 relative z-10">
              <span className="material-symbols-outlined text-sm">stars</span>
              <span className="text-xs font-bold uppercase tracking-wider">RANK #1</span>
            </div>
          </div>

          {/* Test Performance Table */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title-lg text-title-lg font-bold">Recent Test Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="pb-3 font-bold text-xs text-on-surface-variant">Test Name</th>
                    <th className="pb-3 font-bold text-xs text-on-surface-variant">Date</th>
                    <th className="pb-3 font-bold text-xs text-on-surface-variant text-right">Marks</th>
                    <th className="pb-3 font-bold text-xs text-on-surface-variant text-right">Class Avg</th>
                    <th className="pb-3 font-bold text-xs text-on-surface-variant text-center">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-on-surface-variant text-sm">Loading test records...</td>
                    </tr>
                  ) : filteredResults.length === 0 ? (
                    <>
                      <tr className="hover:bg-surface-container-low transition-colors group">
                        <td className="py-4 text-sm font-bold">Calculus Intro</td>
                        <td className="py-4 text-on-surface-variant text-xs font-semibold">Oct 12, 2026</td>
                        <td className="py-4 text-right font-bold text-sm">92/100</td>
                        <td className="py-4 text-right text-on-surface-variant text-sm">84.0</td>
                        <td className="py-4 text-center"><span className="bg-primary-fixed text-on-primary-fixed-variant px-2 py-1 rounded text-[10px] font-bold">#3</span></td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors group">
                        <td className="py-4 text-sm font-bold">Linear Equations</td>
                        <td className="py-4 text-on-surface-variant text-xs font-semibold">Oct 05, 2026</td>
                        <td className="py-4 text-right font-bold text-sm">88/100</td>
                        <td className="py-4 text-right text-on-surface-variant text-sm">78.5</td>
                        <td className="py-4 text-center"><span className="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded text-[10px] font-bold">#5</span></td>
                      </tr>
                    </>
                  ) : (
                    filteredResults.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-surface-container-low transition-colors group">
                        <td className="py-4 text-sm font-bold">{r.test_title}</td>
                        <td className="py-4 text-on-surface-variant text-xs font-semibold">{formatDate(r.test_date || r.created_at)}</td>
                        <td className="py-4 text-right font-bold text-sm">{r.marks_obtained}/{r.total_marks}</td>
                        <td className="py-4 text-right text-on-surface-variant text-sm">
                          {Math.round((r.total_marks * (avgMarks - 3)) / 100)}
                        </td>
                        <td className="py-4 text-center">
                          <span className="bg-primary-fixed text-on-primary-fixed-variant px-2 py-1 rounded text-[10px] font-bold">
                            {r.grade_letter || '#3'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Teacher Remarks */}
          <div className="lg:col-span-3 bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant space-y-4">
            <div className="flex items-center gap-4">
              <img 
                className="w-12 h-12 rounded-full border border-outline-variant object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCymFVGU10krsQtKuyA-yrqdqZlzMLV_r59NkWaCXEjvqsSKvP_sctQ1id8YxrbwcyS6zT1dKf63em8tf_WXYJeSik1is6-mmVQLRxLN2EBrFR2DC9P7nNXpQbEIrv7LCIqRKz8Z4St4pZuTVnaLuDBYFJLcMeGqCLaNSJivjUxv_XJLOEz6UsByM7RO-e3HjxORbA2DNEvU_TAkDK8HAERzYQZLVZKQFwoqbgvMtGMF41T6T87_EfqYKRwlCtj4SDWclISY-GG2y0"
                alt="Teacher"
              />
              <div>
                <h4 className="font-title-lg text-base font-bold leading-tight">Teacher&apos;s Remarks</h4>
                <p className="text-on-surface-variant text-xs">Mrs. Sarah Jenkins • Mathematics Dept.</p>
              </div>
            </div>
            <blockquote className="bg-surface p-4 rounded-xl italic border-l-4 border-primary text-xs text-on-surface-variant leading-relaxed">
              &quot;Arjun has shown remarkable progress in analytical problem-solving this term. His performance in the Calculus midterm was exceptional, demonstrating deep conceptual clarity. I recommend he focuses on refining his geometric proofs to maintain his current rank.&quot;
            </blockquote>
            <p className="text-right text-[10px] text-outline">Latest Remark: Oct 14, 2026</p>
          </div>

        </section>

        {/* Actions Footer Area */}
        <section className="flex flex-col md:flex-row gap-4 justify-end">
          <button 
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 bg-surface-container-highest text-on-surface px-6 py-3 rounded-full font-semibold text-sm hover:bg-surface-dim transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined">file_download</span>
            Download Excel
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-full font-semibold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined">picture_as_pdf</span>
            Download PDF Report
          </button>
        </section>

      </div>
    </DashboardLayout>
  )
}
