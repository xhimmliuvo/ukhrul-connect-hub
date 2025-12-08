import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ServiceAreaProvider } from "@/contexts/ServiceAreaContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Saved from "./pages/Saved";
import Events from "./pages/Events";
import Services from "./pages/Services";
import Businesses from "./pages/Businesses";
import BusinessDetail from "./pages/BusinessDetail";
import Places from "./pages/Places";
import PlaceDetail from "./pages/PlaceDetail";
import NotFound from "./pages/NotFound";

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
              <Route path="/profile" element={<Profile />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/events" element={<Events />} />
              <Route path="/services" element={<Services />} />
              <Route path="/businesses" element={<Businesses />} />
              <Route path="/businesses/:slug" element={<BusinessDetail />} />
              <Route path="/places" element={<Places />} />
              <Route path="/places/:slug" element={<PlaceDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ServiceAreaProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
