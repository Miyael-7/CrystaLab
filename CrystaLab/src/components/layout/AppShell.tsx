import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useRouter } from '../../lib/router/HashRouter';
import { NAV_ITEMS, ROUTES } from '../../routes';
import { BrandMark } from './BrandMark';
import styles from './AppShell.module.css';

export function AppShell({ children }: { children: ReactNode }) {
  const { path } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Cerrar el menú móvil al cambiar de sección.
  useEffect(() => setMenuOpen(false), [path]);

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#contenido" onClick={(e) => {
        e.preventDefault();
        document.getElementById('contenido')?.focus();
      }}>
        Saltar al contenido
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to={ROUTES.home} className={styles.brand} aria-label="CrystaLab — inicio">
            <BrandMark size={28} />
            <span className={styles.brandText}>
              Crysta<span className={styles.brandAccent}>Lab</span>
            </span>
          </Link>

          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="nav-principal"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className={styles.menuIcon} data-open={menuOpen} aria-hidden="true" />
            <span className={styles.srOnly}>{menuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
          </button>

          <nav id="nav-principal" className={styles.nav} data-open={menuOpen} aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === ROUTES.home}
                className={styles.navLink}
                activeClassName={styles.navLinkActive}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main id="contenido" tabIndex={-1} className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>
            <strong>CrystaLab</strong> · Laboratorio virtual de Ingeniería de Materiales
          </span>
          <span className={styles.footerMuted}>Facultad de Ingeniería · UNAM</span>
        </div>
      </footer>
    </div>
  );
}
