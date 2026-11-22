import { Link } from '../../lib/router/HashRouter';
import { ROUTES } from '../../routes';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <section className={styles.wrap}>
      <p className={styles.code}>[0 0 0]</p>
      <h1>Esta dirección no existe</h1>
      <p className={styles.muted}>
        Igual que el vector nulo, esta ruta no apunta a ningún lado.
      </p>
      <Link to={ROUTES.home} className={styles.button}>
        Volver al inicio
      </Link>
    </section>
  );
}
