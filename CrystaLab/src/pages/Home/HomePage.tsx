import { Link } from '../../lib/router/HashRouter';
import { ROUTES } from '../../routes';
import { CellDiagram } from '../../components/diagrams/CellDiagram';
import { SchmidDiagram } from '../../components/diagrams/SchmidDiagram';
import { ColorLegend } from '../../components/ui/ColorLegend';
import { Idx } from '../../components/ui/Idx';
import { Tex } from '../../components/ui/Tex';
import styles from './HomePage.module.css';

const PIPELINE = [
  { k: '01', t: 'Notación', d: <>Plano <Idx v={[1, 1, 1]} kind="plane" /> y dirección <Idx v={[1, -1, 0]} /></> },
  { k: '02', t: 'Vectores', d: <>En un cristal cúbico, <Tex>{'\\hat n \\parallel [hkl]'}</Tex></> },
  { k: '03', t: 'Ángulos', d: <>φ con la normal y λ con la dirección</> },
  { k: '04', t: 'Factor de Schmid', d: <Tex>{'m=\\cos\\varphi\\cos\\lambda'}</Tex> },
  { k: '05', t: 'Cortante resuelto', d: <Tex>{'\\tau_R=\\sigma\\,m'}</Tex> },
  { k: '06', t: '¿Desliza?', d: <Tex>{'|\\tau_R|\\ \\geq\\ \\tau_{CRSS}'}</Tex> },
];

const WHY = [
  {
    title: 'Las propiedades dependen de la dirección',
    text: 'En un cristal, el módulo elástico, la resistencia y el comportamiento magnético cambian con la orientación. Los índices de Miller permiten nombrar esas orientaciones sin ambigüedad.',
  },
  {
    title: 'Los metales se deforman por deslizamiento',
    text: 'La deformación plástica ocurre cuando planos compactos de átomos se deslizan en direcciones compactas. No todos los sistemas de deslizamiento se activan al mismo tiempo.',
  },
  {
    title: 'La orientación decide la resistencia',
    text: 'El mismo material puede fluir con esfuerzos muy distintos según cómo esté orientado respecto a la carga. Esto importa en monocristales, en texturas de laminado y en álabes de turbina.',
  },
];

const SECTIONS = [
  { to: ROUTES.miller, tag: '01', title: 'Índices de Miller', text: 'Construye direcciones [uvw] y planos (hkl) en una celda unitaria cúbica en 3D.', color: 'var(--accent)' },
  { to: ROUTES.schmid, tag: '02', title: 'Ley de Schmid', text: 'Aplica tensión o compresión a una probeta y observa cuándo se activa el deslizamiento.', color: 'var(--c-load)' },
  { to: ROUTES.systems, tag: '03', title: 'Sistemas FCC / BCC', text: 'Compara los 12 sistemas de deslizamiento de cada estructura y descubre cuál se activa primero.', color: 'var(--c-slip)' },
  { to: ROUTES.library, tag: '04', title: 'Biblioteca teórica', text: 'Fundamentos de cristalografía y deformación plástica, con ejemplos resueltos.', color: 'var(--c-normal)' },
];

export function HomePage() {
  return (
    <>
      {/* ---------- Portada ---------- */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Laboratorio virtual · Ingeniería de Materiales</p>
          <h1 className={styles.title}>
            De la geometría del cristal
            <span className={styles.titleAccent}> a la deformación plástica.</span>
          </h1>
          <p className={styles.lead}>
            CrystaLab convierte los índices de Miller y la Ley de Schmid en modelos tridimensionales que puedes
            manipular: cambia la orientación, aplica un esfuerzo y observa cómo responde el sistema de deslizamiento.
          </p>
          <div className={styles.actions}>
            <Link to={ROUTES.schmid} className={styles.primary}>Abrir simulador de Schmid</Link>
            <Link to={ROUTES.miller} className={styles.secondary}>Empezar por Miller</Link>
          </div>
        </div>
        <figure className={styles.heroVisual}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <CellDiagram
            title="Celda unitaria FCC con el plano (1 1 1) y la dirección [−1 1 0] contenida en él"
            atoms="fcc"
            planes={[{ hkl: [1, 1, 1], color: 'var(--c-plane)', label: true }]}
            directions={[{ uvw: [-1, 1, 0], color: 'var(--c-slip)', label: true }]}
            width={380}
          />
          <figcaption className={styles.heroCaption}>
            Sistema de deslizamiento FCC: plano <Idx v={[1, 1, 1]} kind="plane" /> con la dirección{' '}
            <Idx v={[-1, 1, 0]} />
          </figcaption>
        </figure>
      </section>

      {/* ---------- Del índice a la deformación ---------- */}
      <section className={styles.band}>
        <div className={styles.container}>
          <h2 className={styles.h2}>Del índice a la deformación, en seis pasos</h2>
          <ol className={styles.pipeline}>
            {PIPELINE.map((s) => (
              <li key={s.k} className={styles.step}>
                <span className={styles.stepKey}>{s.k}</span>
                <strong className={styles.stepTitle}>{s.t}</strong>
                <span className={styles.stepText}>{s.d}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Introducciones ---------- */}
      <section className={styles.container}>
        <div className={styles.intro}>
          <div className={styles.introText}>
            <p className={styles.eyebrow}>Herramienta de apoyo</p>
            <h2 className={styles.h2}>Índices de Miller</h2>
            <p>
              Son la notación para nombrar direcciones y planos dentro de un cristal. Una <strong>dirección</strong> se
              escribe entre corchetes, <Idx v={[1, 1, 0]} />, y un <strong>plano</strong> entre paréntesis,{' '}
              <Idx v={[1, 1, 1]} kind="plane" />. Los índices negativos llevan una barra encima: <Idx v={[-1, 1, 0]} />.
            </p>
            <p>
              Las direcciones y los planos equivalentes por simetría forman familias, <Idx v={[1, 1, 0]} kind="directionFamily" /> y{' '}
              <Idx v={[1, 1, 1]} kind="planeFamily" />, que comparten las mismas propiedades.
            </p>
            <Link to={ROUTES.miller} className={styles.textLink}>Ir al simulador de Miller →</Link>
          </div>
          <div className={styles.introVisual}>
            <CellDiagram
              title="Direcciones [100], [110] y [111] en una celda cúbica"
              axes
              directions={[
                { uvw: [1, 0, 0], color: 'var(--c-load)', label: true },
                { uvw: [1, 1, 0], color: 'var(--c-slip)', label: true },
                { uvw: [1, 1, 1], color: 'var(--c-normal)', label: true },
              ]}
              width={300}
            />
          </div>
        </div>

        <div className={`${styles.intro} ${styles.introReverse}`}>
          <div className={styles.introText}>
            <p className={styles.eyebrow}>Simulador principal</p>
            <h2 className={styles.h2}>Ley de Schmid</h2>
            <p>
              Un esfuerzo uniaxial σ aplicado a un monocristal genera, sobre cada sistema de deslizamiento, un esfuerzo
              cortante resuelto que depende solo de la orientación:
            </p>
            <Tex block>{'\\tau_R = \\sigma\\,\\cos\\varphi\\,\\cos\\lambda'}</Tex>
            <p>
              El deslizamiento comienza cuando <Tex>{'|\\tau_R|'}</Tex> alcanza el esfuerzo cortante crítico resuelto{' '}
              <Tex>{'\\tau_{CRSS}'}</Tex>, una propiedad del material. En el caso general φ y λ son independientes: su
              suma <em>no</em> tiene por qué ser 90°.
            </p>
            <Link to={ROUTES.schmid} className={styles.textLink}>Ir al simulador de Schmid →</Link>
          </div>
          <div className={styles.introVisual}>
            <SchmidDiagram title="Probeta en tensión con plano de deslizamiento, normal, dirección y ángulos φ y λ" width={290} />
          </div>
        </div>
      </section>

      {/* ---------- Por qué importa ---------- */}
      <section className={styles.band}>
        <div className={styles.container}>
          <h2 className={styles.h2}>¿Por qué importa la geometría cristalográfica?</h2>
          <div className={styles.why}>
            {WHY.map((w) => (
              <article key={w.title} className={styles.whyCard}>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Accesos ---------- */}
      <section className={styles.container}>
        <h2 className={styles.h2}>Explora el laboratorio</h2>
        <div className={styles.grid}>
          {SECTIONS.map((s) => (
            <Link key={s.to} to={s.to} className={styles.card} style={{ ['--card-color' as string]: s.color }}>
              <span className={styles.cardTag}>{s.tag}</span>
              <h3 className={styles.cardTitle}>{s.title}</h3>
              <p className={styles.cardText}>{s.text}</p>
              <span className={styles.cardCta}>Entrar →</span>
            </Link>
          ))}
        </div>

        <div className={styles.legendBox}>
          <h3 className={styles.legendTitle}>Código de colores</h3>
          <p className={styles.legendNote}>Cada elemento físico conserva su color en todos los modelos, diagramas y paneles.</p>
          <ColorLegend />
        </div>
      </section>
    </>
  );
}
