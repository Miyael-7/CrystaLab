import { useEffect, useState } from 'react';
import { SourceTag } from '../../components/ui/Callout';
import { millerChapter } from '../../content/library/millerChapter';
import { schmidChapter } from '../../content/library/schmidChapter';
import { REFERENCES } from '../../content/library/references';
import styles from './LibraryPage.module.css';

const CHAPTERS = [millerChapter, schmidChapter];
const ALL_IDS = CHAPTERS.flatMap((c) => c.sections.map((s) => s.id));

/** Desplaza hasta una sección. No usa el hash (#), que pertenece al enrutador. */
function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 76;
  window.scrollTo({ top, behavior: 'smooth' });
}

export function LibraryPage() {
  const [active, setActive] = useState(ALL_IDS[0]);

  // Resalta en el índice la sección que se está leyendo: la última cuyo
  // encabezado ya pasó por debajo de la barra superior.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = ALL_IDS[0];
      for (const id of ALL_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 130) current = id;
      }
      // Al llegar al final de la página, la última sección queda activa.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = ALL_IDS[ALL_IDS.length - 1];
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar} aria-label="Índice de la biblioteca">
        <p className={styles.sidebarTitle}>Contenido</p>
        <nav>
          {CHAPTERS.map((c) => (
            <div key={c.id} className={styles.tocChapter}>
              <p className={styles.tocChapterTitle}>
                <span className={styles.tocNum}>{c.number}</span> {c.title}
              </p>
              <ul>
                {c.sections.map((s) => (
                  <li key={s.id}>
                    <button type="button" className={styles.tocLink} data-active={active === s.id} onClick={() => goTo(s.id)}>
                      {s.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button type="button" className={styles.tocLink} onClick={() => goTo('referencias')}>
            Referencias
          </button>
        </nav>
        <div className={styles.legend}>
          <SourceTag source="clase" />
          <span>Basado en las presentaciones del curso.</span>
          <SourceTag source="complemento" />
          <span>Tomado de la bibliografía para ampliar el tema.</span>
        </div>
      </aside>

      <article className={styles.article}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Sección 4 · Teoría</p>
          <h1>Biblioteca teórica</h1>
          <p className={styles.lead}>
            Fundamentos de cristalografía y de deformación plástica que respaldan los simuladores. Cada apartado indica
            si proviene del <strong>material de clase</strong> o es un <strong>complemento bibliográfico</strong>.
          </p>
        </header>

        {CHAPTERS.map((c) => (
          <section key={c.id} className={styles.chapter} aria-labelledby={`cap-${c.id}`}>
            <header className={styles.chapterHeader}>
              <span className={styles.chapterNum}>Capítulo {c.number}</span>
              <h2 id={`cap-${c.id}`}>{c.title}</h2>
              <div className={styles.chapterIntro}>{c.intro}</div>
            </header>

            {c.sections.map((s) => (
              <section key={s.id} id={s.id} className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3>{s.title}</h3>
                  <div className={styles.tags}>
                    {s.sources.map((src) => (
                      <SourceTag key={src} source={src} />
                    ))}
                  </div>
                </div>
                <div className={styles.prose}>{s.content}</div>
              </section>
            ))}
          </section>
        ))}

        <section id="referencias" className={styles.section}>
          <h3>Referencias</h3>
          <div className={styles.prose}>
            <p>
              El contenido marcado como «Contenido de clase» se basa en las presentaciones del curso de Ingeniería de
              Materiales (Facultad de Ingeniería, UNAM). Los complementos se basan en:
            </p>
            <ol>
              {REFERENCES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </div>
        </section>
      </article>
    </div>
  );
}
