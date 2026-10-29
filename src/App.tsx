import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ThemeProvider from "./components/ThemeProvider";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGate from "./components/RoleGate";
import AuthPage from "./pages/Auth";
import Home from "./pages/Home";
import CalendarPage from "./pages/Calendar";
import Schedule from "./pages/Schedule";
import Exams from "./pages/Exams";
import Meal from "./pages/Meal";
import MealTransfer from "./pages/MealTransfer";
import Library from "./pages/Library";
import Resources from "./pages/Resources";
import Tickets from "./pages/Tickets";
import WardenTickets from "./pages/WardenTickets";
import ServicesTickets from "./pages/ServicesTickets";
import WarehouseRequests from "./pages/WarehouseRequests";
import SecretaryComplaints from "./pages/SecretaryComplaints";
import Profile from "./pages/Profile";
import ContactPage from "./pages/Contact";
import QualityControl from "./pages/QualityControl";
import Admin from "./pages/Admin";
import AdminTicketsDashboard from "./pages/AdminTicketsDashboard";
import ScanMeal from "./pages/ScanMeal";
import CouncilLockerReceipts from "./pages/CouncilLockerReceipts";
import KnowledgeBase from "./pages/KnowledgeBase";
import QualityControlV2 from "./pages/QualityControlV2";
import DormInspection from "./pages/DormInspection";
import LockerV2 from "./pages/LockerV2";
import NotFound from "./pages/NotFound";
import StudentServices from "./pages/StudentServices";
import Surveys from "./pages/Surveys";
import AccessManagement from "./pages/AccessManagement";
import StudentVoice from "./pages/StudentVoice";
import CouncilPortal from "./pages/CouncilPortal";
import CouncilDetail from "./pages/CouncilDetail";
import StudentCommunication from "./pages/StudentCommunication";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <div className="font-vazir" dir="rtl">
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/calendar" element={<Layout><RoleGate permission="student.use"><CalendarPage /></RoleGate></Layout>} />
                <Route path="/library" element={<Layout><RoleGate permission="student.use"><Library /></RoleGate></Layout>} />
                <Route path="/schedule" element={<Layout><RoleGate permission="student.use"><Schedule /></RoleGate></Layout>} />
                <Route path="/exams" element={<Layout><RoleGate permission="student.use"><Exams /></RoleGate></Layout>} />
                <Route path="/meal" element={<Layout><RoleGate permission="student.use"><Meal /></RoleGate></Layout>} />
                <Route path="/meal-transfer" element={<Layout><RoleGate permission="student.use"><MealTransfer /></RoleGate></Layout>} />
                <Route path="/resources" element={<Layout><RoleGate permission="student.use"><Resources /></RoleGate></Layout>} />
                <Route path="/tickets" element={<Layout><RoleGate permission="student.use"><Tickets /></RoleGate></Layout>} />
                <Route path="/communication" element={<Layout><RoleGate permission="student.use"><StudentCommunication /></RoleGate></Layout>} />
                <Route path="/student-voice" element={<Layout><RoleGate permission="student.use"><StudentVoice /></RoleGate></Layout>} />
                <Route path="/complaints" element={<Navigate to="/student-voice" replace />} />
                <Route path="/feedback" element={<Navigate to="/student-voice" replace />} />
                <Route path="/suggestions" element={<Navigate to="/student-voice" replace />} />
                <Route path="/kb" element={<Layout><RoleGate permission="student.use"><KnowledgeBase /></RoleGate></Layout>} />
                <Route path="/warden/tickets" element={<Layout><RoleGate permission="tickets.manage"><WardenTickets /></RoleGate></Layout>} />
                <Route path="/services/tickets" element={<Layout><RoleGate permission="tickets.manage"><ServicesTickets /></RoleGate></Layout>} />
                <Route path="/warehouse/requests" element={<Layout><RoleGate permission="warehouse.manage"><WarehouseRequests /></RoleGate></Layout>} />
                <Route path="/secretary/complaints" element={<Layout><RoleGate permission="complaints.manage"><SecretaryComplaints /></RoleGate></Layout>} />
                <Route path="/locker" element={<Navigate to="/locker-v2" replace />} />
                <Route path="/locker-v2" element={<Layout><RoleGate permission="student.use"><LockerV2 /></RoleGate></Layout>} />
                <Route path="/profile" element={<Layout><RoleGate permission="student.use"><Profile /></RoleGate></Layout>} />
                <Route path="/student-services" element={<Layout><RoleGate permissions={["student.use", "dorm.use", "dorm_services.operate", "dorm_services.manage"]}><StudentServices /></RoleGate></Layout>} />
                <Route path="/surveys" element={<Layout><RoleGate permission="student.use"><Surveys /></RoleGate></Layout>} />
                <Route path="/quality-control" element={<Layout><RoleGate permission="quality.manage"><QualityControl /></RoleGate></Layout>} />
                <Route path="/quality-control-v2" element={<Layout><RoleGate permission="administration.manage"><QualityControlV2 /></RoleGate></Layout>} />
                <Route path="/quality-control-dorm" element={<Layout><RoleGate permission="quality.manage"><DormInspection /></RoleGate></Layout>} />
                <Route path="/scan-meal" element={<Layout><RoleGate permission="surveys.manage"><ScanMeal /></RoleGate></Layout>} />
                <Route path="/council/locker-receipts" element={<Layout><RoleGate permission="lockers.manage"><CouncilLockerReceipts /></RoleGate></Layout>} />
                <Route path="/admin" element={<Layout><RoleGate permission="administration.manage"><Admin /></RoleGate></Layout>}/>
                <Route path="/admin/access" element={<Layout><RoleGate permission="roles.manage"><AccessManagement /></RoleGate></Layout>}/>
                <Route path="/admin/tickets-dashboard" element={<Layout><RoleGate permission="administration.manage"><AdminTicketsDashboard /></RoleGate></Layout>}/>
                <Route path="/council" element={<Layout><RoleGate permission="student.use"><CouncilPortal /></RoleGate></Layout>} />
                <Route path="/council/:councilId" element={<Layout><RoleGate permission="student.use"><CouncilDetail /></RoleGate></Layout>} />
                <Route path="/councils/mechanical" element={<Navigate to="/council/mechanical" replace />} />
                <Route path="/councils/electrical-computer" element={<Navigate to="/council/electrical" replace />} />
                <Route path="/councils/chemistry" element={<Navigate to="/council/chemistry" replace />} />
                <Route path="/councils/industrial-materials" element={<Navigate to="/council/industrial" replace />} />
                <Route path="/councils/civil" element={<Navigate to="/council/civil" replace />} />
                <Route path="/councils/basic-sciences" element={<Navigate to="/council/basic" replace />} />
                <Route path="/aminian" element={<Navigate to="/council/aminian" replace />} />
                <Route path="/reyhaneh" element={<Navigate to="/council/reyhaneh" replace />} />
                <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
