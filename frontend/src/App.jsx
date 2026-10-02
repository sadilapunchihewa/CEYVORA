import { lazy, Suspense } from 'react'
const ExperienceDetailsPage = lazy(
  () => import('./pages/ExperienceDetailsPage'),
)
const WebsiteContentPage = lazy(
  () => import('./pages/admin/WebsiteContentPage'),
)
const JourneyIdeaPage = lazy(() => import('./pages/JourneyIdeaPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const AIPlannerPage = lazy(() => import('./pages/AIPlannerPage'))
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
const ExperiencesPage = lazy(() => import('./pages/ExperiencesPage'))
const DestinationsPage = lazy(() => import('./pages/DestinationsPage'))
const ToursPage = lazy(() => import('./pages/ToursPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
const AccountLayout = lazy(() => import('./pages/customer/AccountLayout'))
const CustomerDashboard = lazy(
  () => import('./pages/customer/CustomerDashboard'),
)
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'))
const MyBookingsPage = lazy(() => import('./pages/customer/MyBookingsPage'))
const BookingDetailsPage = lazy(
  () => import('./pages/customer/BookingDetailsPage'),
)
const BookingPage = lazy(() => import('./pages/customer/BookingPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const DestinationDetailsPage = lazy(
  () => import('./pages/DestinationDetailsPage'),
)
const TourDetailsPage = lazy(() => import('./pages/TourDetailsPage'))
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const DestinationsAdminPage = lazy(
  () => import('./pages/admin/DestinationsAdminPage'),
)
const DestinationFormPage = lazy(
  () => import('./pages/admin/DestinationFormPage'),
)
const ToursAdminPage = lazy(() => import('./pages/admin/ToursAdminPage'))
const TourFormPage = lazy(() => import('./pages/admin/TourFormPage'))
const ItineraryAdminPage = lazy(
  () => import('./pages/admin/ItineraryAdminPage'),
)
const EnquiriesAdminPage = lazy(
  () => import('./pages/admin/EnquiriesAdminPage'),
)
const EnquiryDetailsAdminPage = lazy(
  () => import('./pages/admin/EnquiryDetailsAdminPage'),
)
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="page-loading" role="status">
              Loading page…
            </div>
          }
        >
          <Routes>
            <Route element={<AdminProtectedRoute />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="content" element={<WebsiteContentPage />} />
                <Route
                  path="destinations"
                  element={<DestinationsAdminPage />}
                />
                <Route
                  path="destinations/new"
                  element={<DestinationFormPage />}
                />
                <Route
                  path="destinations/:id/edit"
                  element={<DestinationFormPage />}
                />
                <Route path="tours" element={<ToursAdminPage />} />
                <Route path="tours/new" element={<TourFormPage />} />
                <Route path="tours/:id/edit" element={<TourFormPage />} />
                <Route
                  path="tours/:id/itinerary"
                  element={<ItineraryAdminPage />}
                />
                <Route
                  path="bookings/*"
                  element={<Navigate to="/admin/enquiries" replace />}
                />
                <Route path="enquiries" element={<EnquiriesAdminPage />} />
                <Route
                  path="enquiries/:id"
                  element={<EnquiryDetailsAdminPage />}
                />
                <Route
                  path="reviews"
                  element={<Navigate to="/admin/enquiries" replace />}
                />
              </Route>
            </Route>
            <Route element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="destinations" element={<DestinationsPage />} />
              <Route
                path="destinations/:slug"
                element={<DestinationDetailsPage />}
              />
              <Route path="tours" element={<ToursPage />} />
              <Route path="journeys/:slug" element={<JourneyIdeaPage />} />
              <Route path="faq" element={<FAQPage />} />
              <Route path="tours/:slug" element={<TourDetailsPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="experiences" element={<ExperiencesPage />} />
              <Route path="ai-planner" element={<AIPlannerPage />} />
              <Route
                path="experiences/:slug"
                element={<ExperienceDetailsPage />}
              />
              <Route
                path="travel-guide"
                element={<Navigate to="/experiences" replace />}
              />
              <Route path="contact" element={<ContactPage />} />
              <Route path="login" element={<AuthPage key="login" />} />
              <Route
                path="register"
                element={<AuthPage key="register" register />}
              />
              <Route path="tours/:slug/book" element={<BookingPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="account" element={<AccountLayout />}>
                  <Route index element={<CustomerDashboard />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="bookings" element={<MyBookingsPage />} />
                  <Route path="bookings/:id" element={<BookingDetailsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
