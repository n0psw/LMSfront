import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NextStepProvider, NextStepReact } from 'nextstepjs';
import { AuthProvider } from '../contexts/AuthContext.tsx';
import OnboardingManager from '../components/OnboardingManager.tsx';
import ProtectedRoute from '../components/ProtectedRoute.tsx';
import AppLayout from '../layouts/AppLayout.tsx';
import LoginPage from '../pages/LoginPage.tsx';
import DashboardPage from '../pages/DashboardPage.tsx';
import CoursesPage from '../pages/CoursesPage.tsx';
import CourseOverviewPage from '../pages/CourseOverviewPage.tsx';
import ModulePage from '../pages/ModulePage.tsx';
import LecturePage from '../pages/LecturePage.tsx';
import AssignmentsPage from '../pages/assingments/AssignmentsPage.tsx';
import AssignmentPage from '../pages/assingments/AssignmentPage.tsx';
import AssignmentBuilderPage from '../pages/assingments/AssignmentBuilderPage.tsx';
import AssignmentGradingPage from '../pages/assingments/AssignmentGradingPage.tsx';
import AssignmentStudentProgressPage from '../pages/assingments/AssignmentStudentProgressPage.tsx';
import ChatPage from '../pages/ChatPage.tsx';
import TeacherDashboard from '../pages/TeacherDashboard.tsx';

import QuizzesPage from '../pages/QuizzesPage.tsx';
import QuizPage from '../pages/QuizPage.tsx';
import ProfilePage from '../pages/ProfilePage.tsx';
import SettingsPage from '../pages/SettingsPage.tsx';
import TeacherCoursesPage from '../pages/TeacherCoursesPage.tsx';
import CourseBuilderPage from '../pages/CourseBuilderPage.tsx';
import CreateCourseWizard from '../pages/CreateCourseWizard.tsx';
// TeacherCoursePage functionality moved to CourseBuilderPage
import LessonEditPage from '../pages/LessonEditPage.tsx';
import TeacherClassPage from '../pages/TeacherClassPage.tsx';
import AdminDashboard from '../pages/admin/AdminDashboard.tsx';
import UserManagement from '../pages/UserManagement.tsx';
import LessonPage from '../pages/LessonPage.tsx';
import CourseProgressPage from '../pages/CourseProgressPage.tsx';
import EventManagement from '../pages/EventManagement.tsx';
import CreateEvent from '../pages/CreateEvent.tsx';
import EditEvent from '../pages/EditEvent.tsx';
import Calendar from '../pages/Calendar.tsx';
import LandingPage from '../pages/LandingPage.tsx';
import AnalyticsPage from '../pages/analytics/AnalyticsPage.tsx';
import FavoriteFlashcardsPage from '../pages/FavoriteFlashcardsPage.tsx';
import { getAllTourSteps } from '../config/allTourSteps';

export default function Router() {
  const tourSteps = getAllTourSteps();
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <NextStepProvider>
          <NextStepReact steps={tourSteps}>
            <OnboardingManager>
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute requireAuth={false}>
                    <LandingPage />
                  </ProtectedRoute>
                } />
                {/* Auth Routes */}
                <Route path="/login" element={
                  <ProtectedRoute requireAuth={false}>
                      <LoginPage />
                  </ProtectedRoute>
                } />

          {/* Protected App Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <Navigate to="/dashboard" replace />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/courses" element={
            <ProtectedRoute>
              <AppLayout>
                <CoursesPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/course/:courseId" element={
            <ProtectedRoute>
              <AppLayout>
                <CourseOverviewPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Updated module route with course context */}
          <Route path="/course/:courseId/module/:moduleId" element={
            <ProtectedRoute>
              <AppLayout>
                <ModulePage />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Legacy module route - redirect to courses page */}
          <Route path="/module/:moduleId" element={
            <Navigate to="/courses" replace />
          } />

          <Route path="/lecture/:lectureId" element={
            <ProtectedRoute>
              <AppLayout>
                <LecturePage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/assignments" element={
            <ProtectedRoute>
              <AppLayout>
                <AssignmentsPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/favorites" element={
            <ProtectedRoute allowedRoles={['student']}>
              <AppLayout>
                <FavoriteFlashcardsPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/assignment/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <AssignmentPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/assignment/:id/grade" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <AppLayout>
                <AssignmentGradingPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/assignment/:id/progress" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <AppLayout>
                <AssignmentStudentProgressPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/assignment/new" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <AppLayout>
                <AssignmentBuilderPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/assignment/new/lesson/:lessonId" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <AppLayout>
                <AssignmentBuilderPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/assignment/new/group/:groupId" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <AppLayout>
                <AssignmentBuilderPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/assignment/:assignmentId/edit" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <AppLayout>
                <AssignmentBuilderPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/chat" element={
            <ProtectedRoute>
              <AppLayout>
                <ChatPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/quizzes" element={
            <ProtectedRoute>
              <AppLayout>
                <QuizzesPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/quiz/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <QuizPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Teacher Routes */}
          <Route path="/teacher" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <AppLayout>
                <TeacherDashboard />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/teacher/courses" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <AppLayout>
                <TeacherCoursesPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/teacher/course/new" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <AppLayout>
                <CreateCourseWizard />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/teacher/course/:courseId" element={
            <ProtectedRoute>
              <AppLayout>
                <CourseBuilderPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/teacher/course/:courseId/progress" element={
            <ProtectedRoute>
              <AppLayout>
                <CourseProgressPage />
              </AppLayout>
            </ProtectedRoute>
          } />


          <Route path="/teacher/class" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <AppLayout>
                <TeacherClassPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/teacher/course/:courseId/lesson/:lessonId/edit" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <LessonEditPage />
            </ProtectedRoute>
          } />

          <Route path="/course/:courseId/lesson/:lessonId" element={
            <ProtectedRoute>
              <LessonPage />
            </ProtectedRoute>
          } />

          <Route path="/teacher/class/:classId" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <AppLayout>
                <TeacherClassPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout>
                <UserManagement />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/courses" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout>
                <TeacherCoursesPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/events" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout>
                <EventManagement />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/events/create" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateEvent />
            </ProtectedRoute>
          } />

          <Route path="/admin/events/:eventId/edit" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EditEvent />
            </ProtectedRoute>
          } />

          <Route path="/calendar" element={
            <ProtectedRoute>
              <AppLayout>
                <Calendar />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute allowedRoles={['teacher', 'curator', 'admin']}>
              <AppLayout>
                <AnalyticsPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
            </OnboardingManager>
          </NextStepReact>
        </NextStepProvider>
      </AuthProvider>
    </BrowserRouter>
  );
} 