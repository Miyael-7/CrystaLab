import { useMemo, useState } from 'react';
import { Chips, IndexInput, PanelCard, Segmented, Toggle } from '../../components/sim/Controls';
import { Viewport } from '../../components/sim/Viewport';
import sim from '../../components/sim/Sim.module.css';
import { Idx } from '../../components/ui/Idx';
import { Tex } from '../../components/ui/Tex';
import {
  directionDrawing,
  familyMembers,
  formatNumber,
  frac,
  norm,
  planeDrawing,
  reduceIndices,
  validateIndices,
  type Indices,
} from '../../core';
import { Link } from '../../lib/router/HashRouter';
import { ROUTES } from '../../routes';
import { buildMillerScene, type MillerMode } from '../../scenes/millerScene';
import { LazyScene3D as Scene3D } from '../../scenes/LazyScene3D';
import { PALETTE } from '../../styles/palette';

const DIR_EXAMPLES: Indices[] = [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 2, 3], [-1, 1, 0], [-1, -1, 1], [1, -2, 1], [1, 1, 2]];
const PLANE_EXAMPLES: Indices[] = [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 1, 2], [-1, 1, 1], [1, 2, 0], [1, -1, 0], [2, 1, 3]];

const POLY_NAMES: Record<number, string> = { 3: 'triángulo', 4: 'cuadrilátero', 5: 'pentágono', 6: 'hexágono' };
const f = (x: number, s = 4) => formatNumber(x, s);

function MillerLegend({ mode }: { mode: MillerMode }) {
  const items =
    mode === 'direction'
      ? [[PALETTE.accent, 'Dirección [uvw]'], [PALETTE.family, 'Familia <uvw>']]
      : [[PALETTE.plane, 'Plano (hkl)'], [PALETTE.normal, 'Normal [hkl]'], [PALETTE.family, 'Familia {hkl}']];
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 12, display: 'grid', gap: 4 }}>
      {[[PALETTE.axisX, 'Eje x'], [PALETTE.axisY, 'Eje y'], [PALETTE.axisZ, 'Eje z'], ...items].map(([c, t]) => (
        <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
          <span style={{ width: 14, height: 3, borderRadius: 2, background: c }} />
          {t}
        </li>
      ))}
    </ul>
  );
}

export function MillerPage() {
  const [mode, setMode] = useState<MillerMode>('direction');
  const [dir, setDir] = useState<Indices>([1, 1, 0]);
  const [plane, setPlane] = useState<Indices>([1, 1, 1]);
  const [showFamily, setShowFamily] = useState(false);
  const [showCoords, setShowCoords] = useState(true);
  const [showIntercepts, setShowIntercepts] = useState(true);
  const [showNormal, setShowNormal] = useState(true);
  const [viewKey, setViewKey] = useState(0);

  const indices = mode === 'direction' ? dir : plane;
  const valid = validateIndices(indices);

  const scene = useMemo(
    () => (valid.ok ? buildMillerScene({ mode, indices, showFamily, showCoords, showIntercepts, showNormal }) : null),
    [valid.ok, mode, indices, showFamily, showCoords, showIntercepts, showNormal],
  );

  const red = reduceIndices(indices);
  const fam = valid.ok ? familyMembers(indices, mode === 'direction') : [];

  return (
    <div className={sim.page}>
      <header className={sim.pageHead}>
        <div>
          <p className={sim.eyebrow}>Sección 2 · Simulador</p>
          <h1 className={sim.pageTitle}>Índices de Miller</h1>
          <p className={sim.pageLead}>
            Introduce los índices y observa la dirección o el plano dentro de una celda unitaria cúbica 1 × 1 × 1.
          </p>
        </div>
        <Segmented
          ariaLabel="Modo"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'direction', label: 'Dirección [uvw]' },
            { value: 'plane', label: 'Plano (hkl)' },
          ]}
        />
      </header>

      <div className={sim.layout}>
        <div className={sim.stickyView}>
          <Viewport
            onResetView={() => setViewKey((k) => k + 1)}
            legend={<MillerLegend mode={mode} />}
            overlay={!valid.ok ? <p className={sim.error}>{valid.error}</p> : undefined}
          >
            {scene && <Scene3D scene={scene} viewKey={viewKey} ariaLabel={mode === 'direction' ? 'Dirección cristalográfica en la celda unitaria' : 'Plano cristalográfico en la celda unitaria'} />}
          </Viewport>
        </div>

        <aside className={sim.side}>
          <PanelCard title={mode === 'direction' ? 'Dirección' : 'Plano'}>
            <div className={sim.stack}>
              {mode === 'direction' ? (
                <IndexInput label="Índices [u v w]" value={dir} onChange={setDir} kind="direction" color={PALETTE.accent} />
              ) : (
                <IndexInput label="Índices (h k l)" value={plane} onChange={setPlane} kind="plane" letters={['h', 'k', 'l']} color={PALETTE.plane} />
              )}
              <Chips
                label="Ejemplos"
                items={(mode === 'direction' ? DIR_EXAMPLES : PLANE_EXAMPLES).map((v) => ({
                  value: v,
                  label: <Idx v={v} kind={mode === 'direction' ? 'direction' : 'plane'} />,
                }))}
                onPick={(v) => (mode === 'direction' ? setDir(v) : setPlane(v))}
              />
              <div className={sim.stack} style={{ gap: 8 }}>
                <Toggle checked={showCoords} onChange={setShowCoords}>Coordenadas de los vértices</Toggle>
                {mode === 'plane' && <Toggle checked={showIntercepts} onChange={setShowIntercepts}>Intersecciones con los ejes</Toggle>}
                {mode === 'plane' && <Toggle checked={showNormal} onChange={setShowNormal}>Normal al plano</Toggle>}
                <Toggle checked={showFamily} onChange={setShowFamily}>
                  Mostrar la familia {mode === 'direction' ? <Idx v={indices} kind="directionFamily" /> : <Idx v={indices} kind="planeFamily" />}
                </Toggle>
              </div>
            </div>
          </PanelCard>

          {valid.ok && (
            <PanelCard title="Resultados">
              <div className={sim.stack}>
                {red.factor > 1 && (
                  <p className={sim.info}>
                    Los índices tienen un factor común {red.factor}. En notación de Miller se usan los enteros mínimos:{' '}
                    <Idx v={red.reduced} kind={mode === 'direction' ? 'direction' : 'plane'} />.
                    {mode === 'direction'
                      ? ' La dirección es la misma.'
                      : ' Se dibuja el plano con los índices introducidos (corta los ejes en 1/h, 1/k, 1/l).'}
                  </p>
                )}
                {mode === 'direction' ? <DirectionResults v={dir} /> : <PlaneResults v={plane} />}
                {showFamily && (
                  <p className={sim.hint}>
                    La familia {mode === 'direction' ? <Idx v={indices} kind="directionFamily" /> : <Idx v={indices} kind="planeFamily" />} tiene{' '}
                    <strong>{fam.length}</strong> {mode === 'direction' ? 'direcciones' : 'planos'} equivalentes
                    {mode === 'plane' ? ' (sin contar los paralelos opuestos)' : ''}. Se muestran en morado.
                  </p>
                )}
              </div>
            </PanelCard>
          )}
        </aside>
      </div>

      <section className={sim.theory} aria-label="Teoría breve">
        <article className={sim.theoryCard}>
          <h3>Celda unitaria</h3>
          <p>Bloque que, repetido en el espacio, forma el cristal. En el sistema cúbico sus aristas miden lo mismo y forman 90°.</p>
        </article>
        <article className={sim.theoryCard}>
          <h3>Direcciones [uvw]</h3>
          <p>Punta menos inicio, reducido a enteros mínimos. Los negativos llevan barra: <Idx v={[-1, 1, 0]} />.</p>
        </article>
        <article className={sim.theoryCard}>
          <h3>Planos (hkl)</h3>
          <p>Intersecciones con los ejes → recíprocos → enteros mínimos. Si el plano pasa por el origen, se traslada el origen.</p>
        </article>
        <article className={sim.theoryCard}>
          <h3>Familias</h3>
          <p>
            <Idx v={[1, 1, 0]} kind="directionFamily" /> y <Idx v={[1, 1, 1]} kind="planeFamily" /> agrupan direcciones y planos equivalentes por simetría.{' '}
            <Link to={ROUTES.library}>Leer más en la biblioteca →</Link>
          </p>
        </article>
      </section>
    </div>
  );
}

function DirectionResults({ v }: { v: Indices }) {
  const g = directionDrawing(v);
  const len = norm(v);
  const cosines = v.map((x) => x / len);
  const shifted = g.origin.some((x) => x !== 0);
  return (
    <>
      <table className={sim.results}>
        <tbody>
          <tr data-strong="true"><th>Dirección</th><td><Idx v={v} /></td></tr>
          <tr><th>Vector</th><td>({v.join(', ')})</td></tr>
          <tr><th>Magnitud</th><td>√{v.reduce((s, x) => s + x * x, 0)} = {f(len)}</td></tr>
          <tr><th>Inicio</th><td>({g.origin.map(frac).join(', ')}){shifted ? ' *' : ''}</td></tr>
          <tr><th>Punta</th><td>({g.tip.map(frac).join(', ')})</td></tr>
          <tr><th>Ángulo con x, y, z</th><td>{cosines.map((c) => `${f((Math.acos(c) * 180) / Math.PI, 3)}°`).join(' · ')}</td></tr>
        </tbody>
      </table>
      <div className={sim.equation}>
        <p className={sim.hint} style={{ margin: 0 }}>Punta − inicio:</p>
        <Tex block>{`(${g.tip.map(frac).join(',\\,')}) - (${g.origin.map(frac).join(',\\,')}) = (${g.tip.map((t, i) => frac(t - g.origin[i]!)).join(',\\,')})`.replace(/−/g, '-')}</Tex>
      </div>
      {g.scaleFactor < 1 && (
        <p className={sim.hint}>
          Como algún índice es mayor que 1, la flecha se dibuja dividida entre {frac(1 / g.scaleFactor)} para que quepa en la celda. Al multiplicar
          por {frac(1 / g.scaleFactor)} se recuperan los índices.
        </p>
      )}
      {shifted && <p className={sim.hint}>* Con índices negativos, el origen se traslada a la esquina donde esa coordenada vale 1.</p>}
    </>
  );
}

function PlaneResults({ v }: { v: Indices }) {
  const g = planeDrawing(v);
  const axes = ['x', 'y', 'z'];
  const shifted = g.origin.some((x) => x !== 0);
  const inter = g.intercepts.map((t) => (Number.isFinite(t) ? frac(t) : '∞'));
  const terms = v.map((h, i) => (h === 0 ? null : `${h === 1 ? '' : h === -1 ? '-' : h}${axes[i]}`)).filter(Boolean).join(' + ').replace(/\+ -/g, '- ');
  return (
    <>
      <table className={sim.results}>
        <tbody>
          <tr data-strong="true"><th>Plano</th><td><Idx v={v} kind="plane" /></td></tr>
          <tr><th>Origen usado</th><td>({g.origin.map(frac).join(', ')}){shifted ? ' *' : ''}</td></tr>
          <tr><th>Intersecciones</th><td>{inter.map((t, i) => `${axes[i]} = ${t}`).join(' · ')}</td></tr>
          <tr><th>Ecuación</th><td>{terms} = {frac(g.d)}</td></tr>
          <tr><th>Normal (cúbico)</th><td><Idx v={v} /></td></tr>
          <tr><th>Corte con la celda</th><td>{POLY_NAMES[g.polygon.length] ?? `${g.polygon.length} vértices`}</td></tr>
        </tbody>
      </table>
      <div className={sim.equation}>
        <Tex block>{`\\left(\\tfrac{1}{${inter[0] === '∞' ? '\\infty' : inter[0]}},\\ \\tfrac{1}{${inter[1] === '∞' ? '\\infty' : inter[1]}},\\ \\tfrac{1}{${inter[2] === '∞' ? '\\infty' : inter[2]}}\\right) = (${v.join(',\\,')})`.replace(/−/g, '-')}</Tex>
      </div>
      <p className={sim.hint}>
        Intersecciones medidas desde el origen usado; los recíprocos dan los índices.
        {shifted && ' * El plano pasaría por el origen o tiene índices negativos, así que se traslada el origen.'}
      </p>
    </>
  );
}
