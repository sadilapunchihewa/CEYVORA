import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import DestinationsPage from './pages/DestinationsPage'
import ToursPage from './pages/ToursPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import AuthPage from './pages/AuthPage'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AccountLayout from './pages/customer/AccountLayout'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import ProfilePage from './pages/customer/ProfilePage'
import MyBookingsPage from './pages/customer/MyBookingsPage'
import BookingDetailsPage from './pages/customer/BookingDetailsPage'
import BookingPage from './pages/customer/BookingPage'
import NotFoundPage from './pages/NotFoundPage'
import DestinationDetailsPage from './pages/DestinationDetailsPage'
import TourDetailsPage from './pages/TourDetailsPage'
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import DestinationsAdminPage from './pages/admin/DestinationsAdminPage'
import DestinationFormPage from './pages/admin/DestinationFormPage'
import ToursAdminPage from './pages/admin/ToursAdminPage'
import TourFormPage from './pages/admin/TourFormPage'
import ItineraryAdminPage from './pages/admin/ItineraryAdminPage'
import BookingsAdminPage from './pages/admin/BookingsAdminPage'
import BookingDetailsAdminPage from './pages/admin/BookingDetailsAdminPage'
import EnquiriesAdminPage from './pages/admin/EnquiriesAdminPage'
import EnquiryDetailsAdminPage from './pages/admin/EnquiryDetailsAdminPage'
import ReviewsAdminPage from './pages/admin/ReviewsAdminPage'
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AdminProtectedRoute />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="destinations" element={<DestinationsAdminPage />} />
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
              <Route path="bookings" element={<BookingsAdminPage />} />
              <Route
                path="bookings/:id"
                element={<BookingDetailsAdminPage />}
              />
              <Route path="enquiries" element={<EnquiriesAdminPage />} />
              <Route
                path="enquiries/:id"
                element={<EnquiryDetailsAdminPage />}
              />
              <Route path="reviews" element={<ReviewsAdminPage />} />
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
            <Route path="tours/:slug" element={<TourDetailsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<AuthPage key="login" />} />
            <Route
              path="register"
              element={<AuthPage key="register" register />}
            />
            <Route element={<ProtectedRoute />}>
              <Route path="tours/:slug/book" element={<BookingPage />} />
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
      </AuthProvider>
    </BrowserRouter>
  )
}
