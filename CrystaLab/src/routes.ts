/** Rutas de la aplicación (fuente única para navegación y enlaces). */
export const ROUTES = {
  home: '/',
  miller: '/miller',
  schmid: '/schmid',
  systems: '/sistemas',
  library: '/biblioteca',
} as const;

export interface NavItem {
  to: string;
  label: string;
  short: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.home, label: 'Inicio', short: 'Inicio' },
  { to: ROUTES.miller, label: 'Índices de Miller', short: 'Miller' },
  { to: ROUTES.schmid, label: 'Ley de Schmid', short: 'Schmid' },
  { to: ROUTES.systems, label: 'Sistemas FCC / BCC', short: 'FCC/BCC' },
  { to: ROUTES.library, label: 'Biblioteca', short: 'Biblioteca' },
];
