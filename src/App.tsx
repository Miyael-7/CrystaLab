import { HashRouter, Routes } from './lib/router/HashRouter';
import { AppShell } from './components/layout/AppShell';
import { ROUTES } from './routes';
import { HomePage } from './pages/Home/HomePage';
import { MillerPage } from './pages/Miller/MillerPage';
import { SchmidPage } from './pages/Schmid/SchmidPage';
import { SlipSystemsPage } from './pages/SlipSystems/SlipSystemsPage';
import { LibraryPage } from './pages/Library/LibraryPage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';

export function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes
          routes={[
            { path: ROUTES.home, element: <HomePage /> },
            { path: ROUTES.miller, element: <MillerPage /> },
            { path: ROUTES.schmid, element: <SchmidPage /> },
            { path: ROUTES.systems, element: <SlipSystemsPage /> },
            { path: ROUTES.library, element: <LibraryPage /> },
          ]}
          fallback={<NotFoundPage />}
        />
      </AppShell>
    </HashRouter>
  );
}
