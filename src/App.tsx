import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";

import PageTransition from "@/components/PageTransition";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import brasaoImg from "@/assets/brasao-republica.png";
import { Loader2 } from "lucide-react";

// Eagerly loaded (critical path)
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";

// Lazy loaded
const CategoriaLegislacao = lazy(() => import("./pages/CategoriaLegislacao.tsx"));
const Noticias = lazy(() => import("./pages/Noticias.tsx"));
const Novidades = lazy(() => import("./pages/Novidades.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Configuracoes = lazy(() => import("./pages/Configuracoes.tsx"));
const RadarDeputados = lazy(() => import("./pages/RadarDeputados.tsx"));
const RadarVotacoes = lazy(() => import("./pages/RadarVotacoes.tsx"));
const RadarRankings = lazy(() => import("./pages/RadarRankings.tsx"));
const RadarProposicoes = lazy(() => import("./pages/RadarProposicoes.tsx"));
const RadarDeputadoDetalhe = lazy(() => import("./pages/RadarDeputadoDetalhe.tsx"));
const LegislacaoEstadual = lazy(() => import("./pages/LegislacaoEstadual.tsx"));
const EstadoDetalhe = lazy(() => import("./pages/EstadoDetalhe.tsx"));
const ExplicacaoLei = lazy(() => import("./pages/ExplicacaoLei.tsx"));
const RadarPLDetalhe = lazy(() => import("./pages/RadarPLDetalhe.tsx"));
const NarracaoLei = lazy(() => import("./pages/NarracaoLei.tsx"));
const GrafoArtigos = lazy(() => import("./pages/GrafoArtigos.tsx"));
const Ferramentas = lazy(() => import("./pages/Ferramentas.tsx"));
const Radar360 = lazy(() => import("./pages/Radar360.tsx"));
const Estudar = lazy(() => import("./pages/Estudar.tsx"));
const Aprender = lazy(() => import("./pages/Aprender.tsx"));
const ArtigoEducacional = lazy(() => import("./pages/ArtigoEducacional.tsx"));
const CategoriaAprender = lazy(() => import("./pages/CategoriaAprender.tsx"));
const Gamificacao = lazy(() => import("./pages/Gamificacao.tsx"));
const Resumos = lazy(() => import("./pages/Resumos.tsx"));
const SimuladoAdmin = lazy(() => import("./pages/SimuladoAdmin.tsx"));
const Simulado = lazy(() => import("./pages/Simulado.tsx"));
const GeracaoAdmin = lazy(() => import("./pages/GeracaoAdmin.tsx"));
const MapaMentalGrafo = lazy(() => import("./pages/MapaMentalGrafo.tsx"));
const AdminMonitor = lazy(() => import("./pages/AdminMonitor.tsx"));
const Perfil = lazy(() => import("./pages/Perfil.tsx"));
const SobreApp = lazy(() => import("./pages/SobreApp.tsx"));
const GeradorPost = lazy(() => import("./pages/GeradorPost.tsx"));
const KanbanLegislativo = lazy(() => import("./pages/KanbanLegislativo.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const preloadImage = new Image();
preloadImage.src = brasaoImg;
preloadImage.decoding = 'sync';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

// Preload critical chunks in idle time
if (typeof window !== 'undefined') {
  const preloadChunks = () => {
    import('./pages/CategoriaLegislacao.tsx');
    import('./pages/Estudar.tsx');
    import('./pages/Ferramentas.tsx');
    import('./pages/Radar360.tsx');
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preloadChunks);
  } else {
    setTimeout(preloadChunks, 1500);
  }
}

function LazyFallback() {
  return (
    <div className="min-h-screen bg-background p-4 pt-16 space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-4 w-64 rounded bg-muted" />
      <div className="space-y-3 mt-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-20 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div className="overflow-x-hidden">
      <Suspense fallback={<LazyFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/legislacao/:tipo" element={<ProtectedRoute><PageTransition><CategoriaLegislacao /></PageTransition></ProtectedRoute>} />
          <Route path="/noticias" element={<ProtectedRoute><PageTransition><Noticias /></PageTransition></ProtectedRoute>} />
          <Route path="/novidades" element={<ProtectedRoute><PageTransition><Novidades /></PageTransition></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><PageTransition><Configuracoes /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/deputados" element={<ProtectedRoute><PageTransition><RadarDeputados /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/votacoes" element={<ProtectedRoute><PageTransition><RadarVotacoes /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/rankings" element={<ProtectedRoute><PageTransition><RadarRankings /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/proposicoes" element={<ProtectedRoute><PageTransition><RadarProposicoes /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/deputado/:id" element={<ProtectedRoute><PageTransition><RadarDeputadoDetalhe /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/pl/:id" element={<ProtectedRoute><PageTransition><RadarPLDetalhe /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao-estadual" element={<ProtectedRoute><PageTransition><LegislacaoEstadual /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao-estadual/:uf" element={<ProtectedRoute><PageTransition><EstadoDetalhe /></PageTransition></ProtectedRoute>} />
          <Route path="/explicacao-lei" element={<ProtectedRoute><PageTransition><ExplicacaoLei /></PageTransition></ProtectedRoute>} />
          <Route path="/narracao" element={<ProtectedRoute><PageTransition><NarracaoLei /></PageTransition></ProtectedRoute>} />
          <Route path="/grafo-artigos" element={<ProtectedRoute><PageTransition><GrafoArtigos /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas" element={<ProtectedRoute><PageTransition><Ferramentas /></PageTransition></ProtectedRoute>} />
          <Route path="/radar-360" element={<ProtectedRoute><PageTransition><Radar360 /></PageTransition></ProtectedRoute>} />
          <Route path="/estudar" element={<ProtectedRoute><PageTransition><Estudar /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender/categoria/:categoriaId" element={<ProtectedRoute><PageTransition><CategoriaAprender /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender/:slug" element={<ProtectedRoute><PageTransition><ArtigoEducacional /></PageTransition></ProtectedRoute>} />
          <Route path="/gamificacao" element={<ProtectedRoute><PageTransition><Gamificacao /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos" element={<ProtectedRoute><PageTransition><Resumos /></PageTransition></ProtectedRoute>} />
          <Route path="/simulado" element={<ProtectedRoute><PageTransition><Simulado /></PageTransition></ProtectedRoute>} />
          <Route path="/simulado-admin" element={<ProtectedRoute><PageTransition><SimuladoAdmin /></PageTransition></ProtectedRoute>} />
          <Route path="/geracao-admin" element={<ProtectedRoute><PageTransition><GeracaoAdmin /></PageTransition></ProtectedRoute>} />
          <Route path="/mapa-mental" element={<ProtectedRoute><PageTransition><MapaMentalGrafo /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-monitor" element={<ProtectedRoute><PageTransition><AdminMonitor /></PageTransition></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PageTransition><Perfil /></PageTransition></ProtectedRoute>} />
          <Route path="/sobre" element={<ProtectedRoute><PageTransition><SobreApp /></PageTransition></ProtectedRoute>} />
          <Route path="/gerador-post" element={<ProtectedRoute><PageTransition><GeradorPost /></PageTransition></ProtectedRoute>} />
          <Route path="/kanban-legislativo" element={<ProtectedRoute><PageTransition><KanbanLegislativo /></PageTransition></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AnimatedRoutes />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
