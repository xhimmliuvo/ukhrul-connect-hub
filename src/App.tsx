import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ServiceAreaProvider } from "@/contexts/ServiceAreaContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Saved from "./pages/Saved";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Services from "./pages/Services";
import Businesses from "./pages/Businesses";
import BusinessDetail from "./pages/BusinessDetail";
import Places from "./pages/Places";
import PlaceDetail from "./pages/PlaceDetail";
import Search from "./pages/Search";
import Orders from "./pages/Orders";
import MyReviews from "./pages/MyReviews";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminServices from "./pages/admin/AdminServices";
import AdminBusinesses from "./pages/admin/AdminBusinesses";
import AdminPlaces from "./pages/admin/AdminPlaces";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminServiceAreas from "./pages/admin/AdminServiceAreas";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import AdminDeliveryOrders from "./pages/admin/AdminDeliveryOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOffers from "./pages/admin/AdminOffers";

// Agent pages
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentOrders from "./pages/agent/AgentOrders";
import AgentActiveDelivery from "./pages/agent/AgentActiveDelivery";
import AgentCompleteDelivery from "./pages/agent/AgentCompleteDelivery";
import AgentEarnings from "./pages/agent/AgentEarnings";
import AgentProfile from "./pages/agent/AgentProfile";
import TrackOrder from "./pages/TrackOrder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ServiceAreaProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/search" element={<Search />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/reviews" element={<MyReviews />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/services" element={<Services />} />
              <Route path="/businesses" element={<Businesses />} />
              <Route path="/businesses/:slug" element={<BusinessDetail />} />
              <Route path="/places" element={<Places />} />
              <Route path="/places/:slug" element={<PlaceDetail />} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/services" element={<AdminServices />} />
              <Route path="/admin/businesses" element={<AdminBusinesses />} />
              <Route path="/admin/places" element={<AdminPlaces />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/service-areas" element={<AdminServiceAreas />} />
              <Route path="/admin/banners" element={<AdminBanners />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/agents" element={<AdminAgents />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
              <Route path="/admin/delivery-orders" element={<AdminDeliveryOrders />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/offers" element={<AdminOffers />} />
              
              {/* Agent routes */}
              <Route path="/agent" element={<AgentDashboard />} />
              <Route path="/agent/orders" element={<AgentOrders />} />
              <Route path="/agent/active" element={<AgentActiveDelivery />} />
              <Route path="/agent/complete/:orderId" element={<AgentCompleteDelivery />} />
              <Route path="/agent/profile" element={<AgentProfile />} />
              <Route path="/agent/earnings" element={<AgentEarnings />} />
              
              {/* Tracking route */}
              <Route path="/track/:orderId" element={<TrackOrder />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ServiceAreaProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
