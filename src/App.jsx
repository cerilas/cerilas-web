import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Capabilities from "./pages/Capabilities";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Consultancy from "./pages/Consultancy";
import Careers from "./pages/Careers";
import Apply from "./pages/Apply";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";

// Admin
import Login from "./pages/admin/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProjectsAdmin from "./pages/admin/ProjectsAdmin";
import ProjectForm from "./pages/admin/ProjectForm";
import ContactAdmin from "./pages/admin/ContactAdmin";
import NewsletterAdmin from "./pages/admin/NewsletterAdmin";
import MediaAdmin from "./pages/admin/MediaAdmin";
import ApplicationsAdmin from "./pages/admin/ApplicationsAdmin";
import JobListingsAdmin from "./pages/admin/JobListingsAdmin";

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin routes - no Navbar/Footer */}
          <Route path="/admin">
            <Route index element={<Login />} />
            <Route element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<ProjectsAdmin />} />
              <Route path="projects/new" element={<ProjectForm />} />
              <Route path="projects/:id" element={<ProjectForm />} />
              <Route path="contacts" element={<ContactAdmin />} />
              <Route path="newsletter" element={<NewsletterAdmin />} />
              <Route path="media" element={<MediaAdmin />} />
              <Route path="job-listings" element={<JobListingsAdmin />} />
              <Route path="applications" element={<ApplicationsAdmin />} />
            </Route>
          </Route>

          {/* Public routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/capabilities" element={<Layout><Capabilities /></Layout>} />
          <Route path="/projects" element={<Layout><Projects /></Layout>} />
          <Route path="/projects/:id" element={<Layout><ProjectDetail /></Layout>} />
          <Route path="/consultancy" element={<Layout><Consultancy /></Layout>} />
          <Route path="/careers" element={<Layout><Careers /></Layout>} />
          <Route path="/careers/apply" element={<Layout><Apply /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/legal/:slug" element={<Layout><Legal /></Layout>} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
