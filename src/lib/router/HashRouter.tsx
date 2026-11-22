/**
 * Enrutador por hash mínimo (sin dependencias).
 *
 * Las rutas viven después del símbolo # (p. ej. .../crystalab/#/schmid).
 * GitHub Pages solo sirve index.html; como el navegador nunca envía el
 * fragmento # al servidor, recargar cualquier página no produce error 404.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react';
import { readHashPath } from './hashPath';

interface RouterState {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterState | null>(null);

export function HashRouter({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => readHashPath(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      setPath(readHashPath(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterState {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter debe usarse dentro de <HashRouter>');
  return ctx;
}

export interface RouteDef {
  path: string;
  element: ReactNode;
}

/** Renderiza la primera ruta cuyo path coincide exactamente; si ninguna, `fallback`. */
export function Routes({ routes, fallback }: { routes: RouteDef[]; fallback: ReactNode }) {
  const { path } = useRouter();
  const match = routes.find((r) => r.path === path);
  return <>{match ? match.element : fallback}</>;
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

export function Link({ to, ...rest }: LinkProps) {
  return <a href={'#' + to} {...rest} />;
}

/**
 * Enlace de navegación que marca la sección activa.
 * `end`: activo solo con coincidencia exacta (útil para '/').
 */
export function NavLink({
  to,
  end = false,
  className,
  activeClassName,
  ...rest
}: LinkProps & { end?: boolean; activeClassName?: string }) {
  const { path } = useRouter();
  const active = end ? path === to : path === to || path.startsWith(to + '/');
  const cls = [className, active ? activeClassName : undefined].filter(Boolean).join(' ');
  return <Link to={to} className={cls || undefined} aria-current={active ? 'page' : undefined} {...rest} />;
}
