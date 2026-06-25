import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function TeacherProfileDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const qualifications = user?.qualifications || [
    'PhD in Theoretical Mathematics (Stanford University, 2015)',
    'M.Sc. in Mathematics & Computing (IIT Bombay, 2011)'
  ]
  const department = user?.department || 'Mathematics Department'
  const assignedClasses = user?.assigned_classes || ['10-A', '11-B']
  const subjects = user?.subjects || ['Mathematics', 'Science']

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-sm pb-24">
        
        {/* Header Back Button */}
        <section className="flex items-center gap-3 pb-2 border-b border-outline-variant/20">
          <button 
            onClick={() => navigate('/teacher/dashboard')}
            className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
          >
            arrow_back
          </button>
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
              Academic Profile
            </h2>
            <p className="text-on-surface-variant text-xs font-semibold mt-0.5">
              Faculty credentials & achievements
            </p>
          </div>
        </section>

        {/* Profile Card Section */}
        <section className="bg-surface-container-lowest rounded-[28px] p-6 shadow-sm border border-outline-variant/30 flex flex-col items-center md:flex-row md:gap-8 text-center md:text-left">
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary-fixed ring-4 ring-primary-container/10 bg-surface-container-low flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.full_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-5xl text-primary/40">face</span>
              )}
            </div>
            <div className="absolute bottom-1 right-1 bg-primary text-white p-1 rounded-full border-2 border-white shadow-md flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex-1">
            <h3 className="font-headline-lg-mobile text-base text-on-surface font-bold">
              {user?.full_name || 'Prof. Sarah Mitchell'}
            </h3>
            <p className="text-on-surface-variant text-xs font-semibold flex items-center justify-center md:justify-start gap-1 mt-1">
              <span className="material-symbols-outlined text-primary text-[16px]">functions</span>
              <span>{department}</span>
            </p>
            <div className="mt-3.5 flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[10px] rounded-full uppercase tracking-wider">
                Senior Faculty
              </span>
              <span className="px-3 py-0.5 bg-secondary-container text-on-secondary-container font-bold text-[10px] rounded-full uppercase tracking-wider">
                Curriculum Lead
              </span>
            </div>
          </div>
        </section>

        {/* Assigned Classes */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-title-lg text-xs text-on-surface font-bold">Assigned Classes</h4>
            <button 
              onClick={() => navigate('/teacher/dashboard')}
              className="text-primary font-bold text-xs hover:underline"
            >
              View Schedule
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {assignedClasses.map((cls, idx) => (
              <div 
                key={cls}
                onClick={() => navigate('/teacher/attendance/mark')}
                className="flex-shrink-0 bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-2xl shadow-sm hover:border-primary transition-all cursor-pointer group min-w-[140px]"
              >
                <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Class {cls}</p>
                <h5 className="font-numeric-bold text-xs font-bold text-on-surface mt-1">
                  {subjects[idx] || subjects[0] || 'Mathematics'}
                </h5>
                <div className="mt-2.5 flex items-center gap-1 text-primary group-hover:gap-1.5 transition-all text-[11px] font-bold">
                  <span>Mark Attendance</span>
                  <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-full bg-primary-container/10 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-primary text-lg">groups</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Students Handled</p>
              <p className="font-numeric-bold text-xl font-bold text-on-surface mt-0.5">42</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-full bg-secondary-container/15 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-secondary text-lg">upload_file</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Results Uploaded</p>
              <p className="font-numeric-bold text-xl font-bold text-on-surface mt-0.5">14</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-full bg-tertiary-fixed-dim/20 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-tertiary text-lg">description</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Homeworks Assigned</p>
              <p className="font-numeric-bold text-xl font-bold text-on-surface mt-0.5">5</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-emerald-700 text-lg">event_available</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Personal Attendance</p>
              <p className="font-numeric-bold text-xl font-bold text-on-surface mt-0.5">98%</p>
            </div>
          </div>
        </section>

        {/* Accomplishments / Summary */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-3xl shadow-sm space-y-3">
            <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider">Performance Summary</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Consistently demonstrates exceptional instructional leadership in Pure Mathematics and Statistics. Her students have shown a 15% increase in standardized test scores this semester. She actively contributes to the digital transformation of teaching materials, maintaining one of the highest repository engagement rates in the department.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-outline-variant/15 pt-3.5">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold">Engagement Score</p>
                  <p className="font-numeric-bold text-xs text-primary font-bold">9.4/10</p>
                </div>
                <div className="h-6 w-[1px] bg-outline-variant/30"></div>
                <div>
                  <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold">Peer Review</p>
                  <p className="font-numeric-bold text-xs text-secondary font-bold">A+</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary-container/10 border border-primary-container/20 p-5 rounded-3xl flex flex-col justify-between h-52">
            <h4 className="font-title-lg text-xs text-primary font-bold uppercase tracking-wider">Result Trends</h4>
            <div className="flex items-end gap-1.5 h-20 mt-3">
              <div className="w-full bg-primary/45 rounded-t transition-all hover:bg-primary" style={{ height: '60%' }}></div>
              <div className="w-full bg-primary/45 rounded-t transition-all hover:bg-primary" style={{ height: '75%' }}></div>
              <div className="w-full bg-primary/45 rounded-t transition-all hover:bg-primary" style={{ height: '65%' }}></div>
              <div className="w-full bg-primary/45 rounded-t transition-all hover:bg-primary" style={{ height: '85%' }}></div>
              <div className="w-full bg-primary rounded-t transition-all hover:bg-primary animate-pulse" style={{ height: '95%' }}></div>
            </div>
            <div className="mt-3">
              <p className="text-[10px] text-primary font-bold">Semesters 1 - 5</p>
              <p className="text-[9px] text-on-surface-variant mt-0.5">Continuous upward growth detected.</p>
            </div>
          </div>
        </section>

        {/* Academic details panel */}
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-outline-variant/20 bg-surface-container-low/40">
            <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider">Professional Credentials</h4>
          </div>
          <div className="p-5 grid gap-6 md:grid-cols-2">
            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">school</span>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Academic Qualifications</p>
                <div className="space-y-1 mt-1 text-xs font-semibold text-on-surface">
                  {qualifications.map((q, idx) => (
                    <p key={idx}>{q}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">mail</span>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Contact Information</p>
                <p className="text-xs font-bold text-on-surface mt-1">{user?.email || 'teacher@educore.com'}</p>
                <p className="text-xs font-semibold text-on-surface-variant mt-0.5">{user?.phone || '+91 98765 43210'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">history</span>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Tenure / Experience</p>
                <p className="text-xs font-bold text-on-surface mt-1">Senior Faculty Member</p>
                <p className="text-xs font-semibold text-on-surface-variant mt-0.5">8 Years, 4 Months of service</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">verified_user</span>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Security Role</p>
                <p className="text-xs font-bold text-on-surface mt-1">Authorized Teacher</p>
                <p className="text-xs font-semibold text-on-surface-variant mt-0.5">Full grade management and attendance permissions</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}
