import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Capabilities from "./pages/Capabilities";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import UseCases from "./pages/UseCases";
import UseCaseDetail from "./pages/UseCaseDetail";
import Consultancy from "./pages/Consultancy";
import Careers from "./pages/Careers";
import Apply from "./pages/Apply";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";
import ScrollToTop from "./components/ScrollToTop";
import CookieConsent from "./components/CookieConsent";
import SiteAnalytics from "./components/SiteAnalytics";

// Admin
import Login from "./pages/admin/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProjectsAdmin from "./pages/admin/ProjectsAdmin";
import ProjectForm from "./pages/admin/ProjectForm";
import UseCasesAdmin from "./pages/admin/UseCasesAdmin";
import UseCaseForm from "./pages/admin/UseCaseForm";
import ContactAdmin from "./pages/admin/ContactAdmin";
import NewsletterAdmin from "./pages/admin/NewsletterAdmin";
import MediaAdmin from "./pages/admin/MediaAdmin";
import ApplicationsAdmin from "./pages/admin/ApplicationsAdmin";
import JobListingsAdmin from "./pages/admin/JobListingsAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import SendersAdmin from "./pages/admin/SendersAdmin";
import MailApiDocs from "./pages/admin/MailApiDocs";
import MailSettings from "./pages/admin/MailSettings";
import SmsSettings from "./pages/admin/SmsSettings";
import SmsApiDocs from "./pages/admin/SmsApiDocs";
import OpportunitiesList from "./pages/admin/OpportunitiesList";
import OpportunityDetail from "./pages/admin/OpportunityDetail";
import OpportunityTracking from "./pages/admin/OpportunityTracking";
import AnalyticsAdmin from "./pages/admin/AnalyticsAdmin";
import Pomodoro from "./pages/admin/Pomodoro";
import ExpensesAdmin from "./pages/admin/ExpensesAdmin";
import { Toaster } from 'react-hot-toast';

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function buildPublicRoutes(prefix = "") {
  const rootPath = prefix || "/";
  const routePath = (path) => `${prefix}${path}`;

  return [
    <Route key={`${rootPath}-home`} path={rootPath} element={<Layout><Home /></Layout>} />,
    <Route key={`${prefix}-about`} path={routePath("/about")} element={<Layout><About /></Layout>} />,
    <Route key={`${prefix}-capabilities`} path={routePath("/capabilities")} element={<Layout><Capabilities /></Layout>} />,
    <Route key={`${prefix}-projects`} path={routePath("/projects")} element={<Layout><Projects /></Layout>} />,
    <Route key={`${prefix}-project-detail`} path={routePath("/projects/:id")} element={<Layout><ProjectDetail /></Layout>} />,
    <Route key={`${prefix}-use-cases`} path={routePath("/use-cases")} element={<Layout><UseCases /></Layout>} />,
    <Route key={`${prefix}-use-case-detail`} path={routePath("/use-cases/:slug")} element={<Layout><UseCaseDetail /></Layout>} />,
    <Route key={`${prefix}-consultancy`} path={routePath("/consultancy")} element={<Layout><Consultancy /></Layout>} />,
    <Route key={`${prefix}-careers`} path={routePath("/careers")} element={<Layout><Careers /></Layout>} />,
    <Route key={`${prefix}-apply`} path={routePath("/careers/apply")} element={<Layout><Apply /></Layout>} />,
    <Route key={`${prefix}-contact`} path={routePath("/contact")} element={<Layout><Contact /></Layout>} />,
    <Route key={`${prefix}-legal`} path={routePath("/legal/:slug")} element={<Layout><Legal /></Layout>} />,
  ];
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <ScrollToTop />
        <SiteAnalytics />
        <Toaster position="top-right" toastOptions={{
          style: {
            background: 'var(--admin-toast-bg, #1f2937)',
            color: 'var(--admin-toast-text, #ffffff)',
            border: '1px solid var(--admin-toast-border, #374151)',
            boxShadow: 'var(--admin-toast-shadow, 0 18px 45px rgb(0 0 0 / 0.28))',
          },
          success: {
            iconTheme: {
              primary: 'var(--admin-toast-success, #22c55e)',
              secondary: 'var(--admin-toast-icon-secondary, #ffffff)',
            },
          },
        }} />
        <CookieConsent />
        <Routes>
          {/* Admin routes - no Navbar/Footer */}
          <Route path="/admin">
            <Route index element={<Login />} />
            <Route element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pomodoro" element={<Pomodoro />} />
              <Route path="projects" element={<ProjectsAdmin />} />
              <Route path="projects/new" element={<ProjectForm />} />
              <Route path="projects/:id" element={<ProjectForm />} />
              <Route path="use-cases" element={<UseCasesAdmin />} />
              <Route path="use-cases/new" element={<UseCaseForm />} />
              <Route path="use-cases/:id" element={<UseCaseForm />} />
              <Route path="contacts" element={<ContactAdmin />} />
              <Route path="newsletter" element={<NewsletterAdmin />} />
              <Route path="media" element={<MediaAdmin />} />
              <Route path="job-listings" element={<JobListingsAdmin />} />
              <Route path="applications" element={<ApplicationsAdmin />} />
              <Route path="users" element={<UsersAdmin />} />
              <Route path="analytics" element={<AnalyticsAdmin />} />
              <Route path="opportunities" element={<OpportunitiesList />} />
              <Route path="opportunities/:id" element={<OpportunityDetail />} />
              <Route path="opportunity-tracking" element={<OpportunityTracking />} />
              <Route path="expenses" element={<ExpensesAdmin />} />
            <Route path="mail-senders" element={<SendersAdmin />} />
            <Route path="mail-docs" element={<MailApiDocs />} />
            <Route path="mail-settings" element={<MailSettings />} />
            <Route path="sms-settings" element={<SmsSettings />} />
            <Route path="sms-docs" element={<SmsApiDocs />} />
            </Route>
          </Route>

          {/* Public routes */}
          {buildPublicRoutes()}
          {buildPublicRoutes("/tr")}
          {buildPublicRoutes("/en")}
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
