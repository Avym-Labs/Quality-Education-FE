import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'

import LoginPage from './pages/auth/LoginPage'

import StudentDashboard from './pages/student/StudentDashboard'
import StudentProfile from './pages/student/StudentProfile'
import StudentProfileGamified from './pages/student/StudentProfileGamified'
import StudentAttendanceDetails from './pages/student/StudentAttendanceDetails'
import StudentAttendanceReport from './pages/student/StudentAttendanceReport'
import StudentResultReport from './pages/student/StudentResultReport'

import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherProfileDashboard from './pages/teacher/TeacherProfileDashboard'
import TeacherPerformanceAnalytics from './pages/teacher/TeacherPerformanceAnalytics'
import TeacherAttendance from './pages/teacher/TeacherAttendance'
import AttendanceMarking from './pages/teacher/AttendanceMarking'
import HomeworkAssignment from './pages/teacher/HomeworkAssignment'
import TestPerformanceAnalytics from './pages/teacher/TestPerformanceAnalytics'
import LeaveRequest from './pages/teacher/LeaveRequest'

import AdminDashboard from './pages/admin/AdminDashboard'
import StudentManagement from './pages/admin/StudentManagement'
import TeacherManagement from './pages/admin/TeacherManagement'
import NewAnnouncement from './pages/admin/NewAnnouncement'
import LeaveApproval from './pages/admin/LeaveApproval'

import ChatList from './pages/shared/ChatList'
import ChatConversation from './pages/shared/ChatConversation'
import NotificationCenter from './pages/shared/NotificationCenter'
import SettingsPage from './pages/shared/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Student routes */}
          <Route path="/student" element={<ProtectedRoute role="student" />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="profile/achievements" element={<StudentProfileGamified />} />
            <Route path="attendance" element={<StudentAttendanceDetails />} />
            <Route path="attendance/report" element={<StudentAttendanceReport />} />
            <Route path="results" element={<StudentResultReport />} />
            <Route path="chat" element={<ChatList />} />
            <Route path="chat/:conversationId" element={<ChatConversation />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Teacher routes */}
          <Route path="/teacher" element={<ProtectedRoute role="teacher" />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="profile" element={<TeacherProfileDashboard />} />
            <Route path="analytics" element={<TeacherPerformanceAnalytics />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="attendance/mark" element={<AttendanceMarking />} />
            <Route path="homework" element={<HomeworkAssignment />} />
            <Route path="tests/analytics" element={<TestPerformanceAnalytics />} />
            <Route path="leave" element={<LeaveRequest />} />
            <Route path="chat" element={<ChatList />} />
            <Route path="chat/:conversationId" element={<ChatConversation />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin" />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="teachers" element={<TeacherManagement />} />
            <Route path="announcements" element={<NewAnnouncement />} />
            <Route path="leave" element={<LeaveApproval />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
