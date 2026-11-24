import { Routes, Route } from "react-router-dom";

import SiteLayout from "./components/SiteLayout.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import HomePage from "./pages/HomePage.jsx";
import PropertiesPage from "./pages/PropertiesPage.jsx";
import PropertyDetailsPage from "./pages/PropertyDetailsPage.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";

import ProfilePage from "./pages/ProfilePage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";

import DashboardOverview from "./pages/dashboard/DashboardOverview.jsx";
import SavedPropertiesPage from "./pages/dashboard/SavedPropertiesPage.jsx";
import DashboardPlaceholderPage from "./pages/dashboard/DashboardPlaceholderPage.jsx";
import MyPropertiesPage from "./pages/dashboard/MyPropertiesPage.jsx";
import EditPropertyPage from "./pages/dashboard/EditPropertyPage.jsx";
import MyApplicationsPage from "./pages/dashboard/MyApplicationsPage.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import AdminPropertyReviews from "./pages/admin/AdminPropertyReviews.jsx";
import AdminPropertyReviewDetails from "./pages/admin/AdminPropertyReviewDetails.jsx";
import { useToast } from "./context/ToastContext.jsx";
import AdminProperties from "./pages/admin/AdminProperties.jsx";
import AdminEstates from "./pages/admin/AdminEstates.jsx";
import AdminApplications from "./pages/admin/AdminApplications.jsx";
import AdminMembers from "./pages/admin/AdminMembers.jsx";
import MyTransactionsPage from "./pages/dashboard/MyTransactionsPage.jsx";
import AdminTransactions from "./pages/admin/AdminTransactions.jsx";
import TransactionPaymentsPage from "./pages/dashboard/TransactionPaymentsPage.jsx";
import DueDiligencePage from "./pages/dashboard/DueDiligencePage.jsx";
import AdminDueDiligence from "./pages/admin/AdminDueDiligence.jsx";
import AdminDueDiligenceDetails from "./pages/admin/AdminDueDiligenceDetails.jsx";
import EstatesPage from "./pages/EstatesPage.jsx";
import EstateDetailsPage from "./pages/EstateDetailsPage.jsx";
import AdminEditEstate from "./pages/admin/AdminEditEstate.jsx";

import {
  SellPropertyPage,
  AIPage,
  AboutPage,
  NotFoundPage,
} from "./pages/InfoPages.jsx";

function ToastTestPage() {
  const { success, error, warning, info } = useToast();

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-6 py-16">
      <h1 className="text-2xl font-bold text-gray-900">
        Notification System Test
      </h1>

      <p className="text-gray-600">Test the four notification types below.</p>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => success("Property published successfully!")}
          className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white"
        >
          Test Success
        </button>

        <button
          onClick={() => error("Unable to complete your request.")}
          className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white"
        >
          Test Error
        </button>

        <button
          onClick={() => warning("Please complete all required fields.")}
          className="rounded-lg bg-yellow-500 px-5 py-3 font-semibold text-white"
        >
          Test Warning
        </button>

        <button
          onClick={() => info("Your application is under review.")}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          Test Info
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public website layout */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailsPage />} />
        <Route path="/estates" element={<EstatesPage />} />
        <Route path="/estates/:slug" element={<EstateDetailsPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/toast-test" element={<ToastTestPage />} />
        <Route
          path="/sell-property"
          element={
            <ProtectedRoute>
              <SellPropertyPage />
            </ProtectedRoute>
          }
        />

        <Route path="/ai/*" element={<AIPage />} />
        <Route path="/about" element={<AboutPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Protected member dashboard layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverview />} />

        <Route path="profile" element={<ProfilePage />} />

        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="my-properties" element={<MyPropertiesPage />} />
        <Route path="due-diligence" element={<DueDiligencePage />} />
        <Route path="my-properties/:id/edit" element={<EditPropertyPage />} />
        <Route path="my-properties" element={<MyPropertiesPage />} />

        <Route path="saved-properties" element={<SavedPropertiesPage />} />

        <Route path="applications" element={<MyApplicationsPage />} />

        <Route path="transactions" element={<MyTransactionsPage />} />
        <Route
          path="transactions/:id/payments"
          element={<TransactionPaymentsPage />}
        />

        <Route
          path="payments"
          element={
            <DashboardPlaceholderPage
              title="Payments"
              description="Payment records and related account activity will be displayed here when the payments module is connected."
            />
          }
        />

        <Route
          path="support"
          element={
            <DashboardPlaceholderPage
              title="Help and support"
              description="This section will provide access to customer support and assistance."
            />
          }
        />

        <Route
          path="*"
          element={
            <DashboardPlaceholderPage
              title="Dashboard page not found"
              description="The dashboard section you requested does not exist."
            />
          }
        />
      </Route>
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="property-reviews" element={<AdminPropertyReviews />} />
        <Route
          path="property-reviews/:id"
          element={<AdminPropertyReviewDetails />}
        />
        <Route path="due-diligence" element={<AdminDueDiligence />} />

        <Route
          path="due-diligence/:caseId"
          element={<AdminDueDiligenceDetails />}
        />
        <Route path="estates" element={<AdminEstates />} />
        <Route path="estates/:estateId/edit" element={<AdminEditEstate />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="properties" element={<AdminProperties />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="members" element={<AdminMembers />} />
      </Route>
    </Routes>
  );
}
