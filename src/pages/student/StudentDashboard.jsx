import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    attendance_percentage: 94.2,
    average_score: 85.0,
    total_tests: 8
  })
  const [homeworkCount, setHomeworkCount] = useState(3)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.student_id) {
        setLoading(false)
        return
      }
      try {
        const [statsRes, hwRes] = await Promise.all([
          api.get(`/students/${user.student_id}/stats`),
          api.get('/homework', { params: { grade: user.grade, section: user.section } }),
        ])
        if (statsRes.data) {
          setStats(statsRes.data)
        }
        if (hwRes.data) {
          setHomeworkCount(hwRes.data.length)
        }
      } catch (err) {
        console.error('Failed to load real dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [user])

  // Dynamic values
  const attendance = stats?.attendance_percentage ?? 94.2
  const score = stats?.average_score ?? 85.0
  const testsCount = stats?.total_tests ?? 8
  
  // Custom calculations for gamification matching the premium look
  const attendancePts = Math.round(attendance * 9)
  const streakDays = Math.round(attendance / 8)
  const rank = score >= 90 ? '#1' : score >= 80 ? '#2' : '#3'
  const rankPercentile = score >= 90 ? 'Top 0.5%' : score >= 80 ? 'Top 1%' : 'Top 5%'
  const tier = score >= 90 ? 'Legend Tier' : score >= 80 ? 'Elite Tier' : 'Aspirant Tier'

  return (
    <DashboardLayout hideTopBar={false}>
      <div className="space-y-stack-lg mt-stack-md">
        
        {/* Profile & Welcome Section */}
        <section className="space-y-stack-sm">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
                {user?.full_name || 'Arjun H.'}
              </h2>
              <p className="font-label-md text-label-md text-on-surface-variant">
                Grade {user?.grade || '10'}-{user?.section || 'A'} • Academic Precision School
              </p>
            </div>
            <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <span className="material-symbols-outlined text-sm animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                stars
              </span>
              <span className="font-label-md text-label-md">{tier}</span>
            </div>
          </div>
        </section>

        {/* Stats Section (Gamified) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
          {/* Attendance Card */}
          <div 
            onClick={() => navigate('/student/attendance')}
            className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow h-28"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-fixed opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
              </div>
              <span className="text-xs font-bold text-primary bg-primary-fixed-dim px-2 py-1 rounded">
                {attendance >= 75 ? '+2.4%' : '-1.2%'}
              </span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant">Attendance</p>
              <p className="font-display-lg text-headline-lg text-on-surface font-bold">{attendance}%</p>
            </div>
          </div>

          {/* Attendance Score Card */}
          <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant flex flex-col justify-between relative overflow-hidden group h-28">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary-fixed opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-1">
              <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <span className="text-xs font-bold text-tertiary bg-tertiary-fixed-dim px-2 py-1 rounded">
                Daily Streak: {streakDays}
              </span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant">Attendance Score</p>
              <p className="font-display-lg text-headline-lg text-on-surface font-bold">
                {attendancePts} <span className="text-sm font-label-md font-normal">pts</span>
              </p>
            </div>
          </div>

          {/* Current Rank Card */}
          <div 
            onClick={() => navigate('/student/results')}
            className="bg-primary-container p-stack-md rounded-[24px] shadow-lg flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow h-28"
          >
            <div className="absolute -right-2 -top-2 w-32 h-32 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
            <div className="flex justify-between items-start mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
              </div>
              <span className="text-xs font-bold text-white bg-white/20 px-2 py-1 rounded">{rankPercentile}</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-white/80">Current Rank</p>
              <p className="font-display-lg text-headline-lg text-white font-bold">{rank}</p>
            </div>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section className="space-y-stack-sm">
          <h3 className="font-title-lg text-title-lg text-on-surface px-1 font-bold">Action Items</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Homework Action */}
            <div 
              onClick={() => navigate('/student/homework')}
              className="bg-surface-container-low p-stack-md rounded-xl hover:bg-surface-container-high transition-all cursor-pointer border border-outline-variant/30 flex flex-col gap-2 group"
            >
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
                assignment
              </span>
              <div>
                <p className="font-numeric-bold text-numeric-bold text-on-surface font-bold">{homeworkCount}</p>
                <p className="text-xs font-medium text-on-surface-variant">Pending Homework</p>
              </div>
            </div>

            {/* Test Performance Action */}
            <div 
              onClick={() => navigate('/student/results')}
              className="bg-surface-container-low p-stack-md rounded-xl hover:bg-surface-container-high transition-all cursor-pointer border border-outline-variant/30 flex flex-col gap-2 group"
            >
              <span className="material-symbols-outlined text-error group-hover:scale-110 transition-transform">
                event
              </span>
              <div>
                <p className="font-numeric-bold text-numeric-bold text-on-surface font-bold">{testsCount}</p>
                <p className="text-xs font-medium text-on-surface-variant">Class Tests</p>
              </div>
            </div>

            {/* Achievements Action */}
            <div 
              onClick={() => navigate('/student/profile/achievements')}
              className="bg-surface-container-low p-stack-md rounded-xl hover:bg-surface-container-high transition-all cursor-pointer border border-outline-variant/30 flex flex-col gap-2 group"
            >
              <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">
                workspace_premium
              </span>
              <div>
                <p className="font-numeric-bold text-numeric-bold text-on-surface font-bold">Cabinet</p>
                <p className="text-xs font-medium text-on-surface-variant">Achievements</p>
              </div>
            </div>

            {/* Chat Action */}
            <div 
              onClick={() => navigate('/student/chat')}
              className="bg-surface-container-low p-stack-md rounded-xl hover:bg-surface-container-high transition-all cursor-pointer border border-outline-variant/30 flex flex-col gap-2 group"
            >
              <span className="material-symbols-outlined text-tertiary-container group-hover:scale-110 transition-transform">
                chat_bubble
              </span>
              <div>
                <p className="font-numeric-bold text-numeric-bold text-on-surface font-bold">Inbox</p>
                <p className="text-xs font-medium text-on-surface-variant">Class Messages</p>
              </div>
            </div>

            {/* Reports Card Action */}
            <div 
              onClick={() => navigate('/student/reports')}
              className="bg-surface-container-low p-stack-md rounded-xl hover:bg-surface-container-high transition-all cursor-pointer border border-outline-variant/30 flex flex-col gap-2 group"
            >
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
                analytics
              </span>
              <div>
                <p className="font-numeric-bold text-numeric-bold text-on-surface font-bold">Report</p>
                <p className="text-xs font-medium text-on-surface-variant">Card & Analytics</p>
              </div>
            </div>

            {/* Calendar Schedule Action */}
            <div 
              onClick={() => navigate('/student/schedule')}
              className="bg-surface-container-low p-stack-md rounded-xl hover:bg-surface-container-high transition-all cursor-pointer border border-outline-variant/30 flex flex-col gap-2 group"
            >
              <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">
                calendar_today
              </span>
              <div>
                <p className="font-numeric-bold text-numeric-bold text-on-surface font-bold">Schedule</p>
                <p className="text-xs font-medium text-on-surface-variant">Lectures & Dates</p>
              </div>
            </div>
          </div>
        </section>

        {/* Charts & Performance */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
          {/* Attendance Trend */}
          <div className="bg-white p-stack-md rounded-[24px] shadow-sm border border-outline-variant space-y-stack-md">
            <div className="flex justify-between items-center">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Weekly Consistency</h3>
              <div className="flex gap-1 items-center">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">Present</span>
              </div>
            </div>
            <div className="flex items-end justify-between h-32 px-2 gap-2 pt-2">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full bg-primary rounded-t-lg transition-all duration-500 hover:opacity-90" style={{ height: '90%' }}></div>
                <span className="text-[10px] font-medium text-on-surface-variant">Mon</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full bg-primary rounded-t-lg transition-all duration-500 hover:opacity-90" style={{ height: '100%' }}></div>
                <span className="text-[10px] font-medium text-on-surface-variant">Tue</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full bg-primary-fixed-dim rounded-t-lg transition-all duration-500 hover:opacity-90" style={{ height: '20%' }}></div>
                <span className="text-[10px] font-medium text-on-surface-variant">Wed</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full bg-primary rounded-t-lg transition-all duration-500 hover:opacity-90" style={{ height: '85%' }}></div>
                <span className="text-[10px] font-medium text-on-surface-variant">Thu</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full bg-primary rounded-t-lg transition-all duration-500 hover:opacity-90" style={{ height: '95%' }}></div>
                <span className="text-[10px] font-medium text-on-surface-variant">Fri</span>
              </div>
            </div>
          </div>

          {/* Performance Trend */}
          <div className="bg-white p-stack-md rounded-[24px] shadow-sm border border-outline-variant space-y-stack-md">
            <div className="flex justify-between items-center">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Performance Trend</h3>
              <span className="material-symbols-outlined text-primary">trending_up</span>
            </div>
            <div className="relative h-32 w-full mt-4">
              <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                <path d="M0 80 Q 50 70, 100 65 T 200 40 T 300 35 T 400 10" fill="none" stroke="#3525cd" strokeLinecap="round" strokeWidth="4"></path>
                <circle cx="0" cy="80" fill="#3525cd" r="4"></circle>
                <circle cx="100" cy="65" fill="#3525cd" r="4"></circle>
                <circle cx="200" cy="40" fill="#3525cd" r="4"></circle>
                <circle cx="300" cy="35" fill="#3525cd" r="4"></circle>
                <circle className="animate-pulse" cx="400" cy="10" fill="#3525cd" r="6"></circle>
              </svg>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-semibold text-on-surface-variant">Test 1</span>
                <span className="text-[10px] font-semibold text-on-surface-variant">Test {testsCount}</span>
              </div>
            </div>
            <p className="text-[12px] text-on-surface-variant italic">Impressive! Your average score is at {score}%.</p>
          </div>
        </section>

        {/* Attendance Rankers (Leaderboard) */}
        <section className="space-y-stack-sm pb-10">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Attendance Rankers</h3>
            <span onClick={() => navigate('/student/profile/achievements')} className="text-primary font-bold text-sm hover:underline cursor-pointer">
              View All
            </span>
          </div>
          <div className="bg-surface-container-lowest rounded-[24px] shadow-sm border border-outline-variant overflow-hidden">
            <div className="divide-y divide-outline-variant/30">
              
              {/* Rank 1 */}
              <div className="flex items-center justify-between p-stack-md hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-stack-md">
                  <div className="relative">
                    <img 
                      alt="Sara M." 
                      className="w-12 h-12 rounded-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwllW5K6RZn9ox5hHeLicw2iz0mhux5XyX2KhoVvq9h672Rdj-y4RYUk3uKyCUl4tHZHP1nQfvpce9IyKhcYBBTH5nHJbzrlM9ybpGrJu0QwvGVGQ6IC3oM1t1EJeg8VEugBS4QpeM_2A1CVhmdgLORNG9-y7pKKqPbHG9YwYKH2cRZuBBRHS7w5wugEW3oyvqQrwmhY0ZsTkB-hA8atxzFJzh-epZAGtVRW-qQrLx4LCC7AafdRKqkCcx3G5yKlPCHHPJteSJPCU"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white font-numeric-bold">1</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-bold text-on-surface">Sara M.</p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        local_fire_department
                      </span>
                      24 Day Streak
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-on-surface font-numeric-bold">99.8%</p>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant">1,240 pts</p>
                </div>
              </div>

              {/* Rank 2 (User) */}
              <div className="flex items-center justify-between p-stack-md bg-primary-fixed/30 hover:bg-primary-fixed/50 transition-colors">
                <div className="flex items-center gap-stack-md">
                  <div className="relative">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.full_name} className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-fixed border-2 border-primary flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">
                          {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-400 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white font-numeric-bold">2</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-bold text-on-surface flex items-center gap-2">
                      {user?.full_name || 'Arjun H.'} (You)
                      <span className="bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest font-bold">
                        Rising
                      </span>
                    </p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        local_fire_department
                      </span>
                      {streakDays} Day Streak
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-on-surface font-numeric-bold">{attendance}%</p>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant">{attendancePts} pts</p>
                </div>
              </div>

              {/* Rank 3 */}
              <div className="flex items-center justify-between p-stack-md hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-stack-md">
                  <div className="relative">
                    <img 
                      alt="Leo K." 
                      className="w-12 h-12 rounded-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTQvIo_mCoQh0zhKOauSP-pWWnkDK-t4UAaPM0uT6i5SSucEzuww9McfEvpAfANzK3-J3dR2PV6NAIYJtqYryA0llODiaiHBHaRxtffhA4rVC9kYpe8sL_Sinc19ERGUQPkqLoTzou1lwvueB3eDUY86CeAq3tPYsreYuD9UDDipPKDXjFa-DB9IrzAq0T8e17FBgWso3JLK7UCWfGUmu2JfngsO3j2Jf_980jBAKJmA172BiogZLuo90mIm8Bvmxq3XuOrB0zT9c"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-400 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white font-numeric-bold">3</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-bold text-on-surface">Leo K.</p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        local_fire_department
                      </span>
                      8 Day Streak
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-on-surface font-numeric-bold">92.1%</p>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant">720 pts</p>
                </div>
              </div>

            </div>
          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}
