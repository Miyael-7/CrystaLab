import { useEffect, useMemo, useState } from 'react';
import { Chips, IndexInput, NumInput, PanelCard, Segmented } from '../../components/sim/Controls';
import { Viewport } from '../../components/sim/Viewport';
import sim from '../../components/sim/Sim.module.css';
import { Callout } from '../../components/ui/Callout';
import { Idx } from '../../components/ui/Idx';
import { formatNumber, type Indices, type StressUnit, type Structure, type Vec3 } from '../../core';
import { useRouter } from '../../lib/router/HashRouter';
import { ROUTES } from '../../routes';
import { LazyScene3D as Scene3D } from '../../scenes/LazyScene3D';
import { buildSystemsScene } from '../../scenes/systemsScene';
import { rowsInPlane } from '../../sim/planeAnalysis';
import { loadSlipSystem } from '../../sim/schmidStore';
import { computeSystems, otherStructure, systemKey, type SystemRow } from '../../sim/systemsModel';
import { PALETTE } from '../../styles/palette';
import { PlaneAnalysis } from './PlaneAnalysis';
import styles from './SlipSystemsPage.module.css';

const LOADS: [number, number, number][] = [
  [1, 0, 0],
  [1, 1, 0],
  [1, 1, 1],
  [1, 2, 1],
  [1, 2, 3],
  [-2, 1, -3],
];
const STATE_TEXT = { inactive: 'No activado', near: 'Próximo', active: 'Activado' } as const;
const f = (x: number, s = 4) => formatNumber(x, s);

export function SlipSystemsPage() {
  const { navigate } = useRouter();
  const [structure, setStructure] = useState<Structure>('BCC');
  const [load, setLoad] = useState<Vec3>([1, 2, 3]);
  const [stress, setStress] = useState(150);
  const [crss, setCrss] = useState(67);
  const [unit, setUnit] = useState<StressUnit>('MPa');
  const [viewKey, setViewKey] = useState(0);

  const res = useMemo(() => computeSystems({ structure, load, stress, crss, unit }), [structure, load, stress, crss, unit]);
  const [selected, setSelected] = useState(0);
  // Al cambiar la estructura o la carga se selecciona el sistema más favorable.
  useEffect(() => setSelected(0), [structure, load]);
  const sel: SystemRow | undefined = res.rows[selected];

  // Vista de la tabla: análisis de un plano (primera opción) o ranking de los 12 sistemas.
  const [view, setView] = useState<'plane' | 'ranking'>('plane');
  const [planeSel, setPlaneSel] = useState<Indices>([1, 0, 1]);
  // El plano analizado sigue al sistema seleccionado (desde la tabla, el ranking o un plano).
  useEffect(() => {
    if (sel) setPlaneSel(sel.plane);
  }, [sel]);
  const choosePlane = (plane: Indices) => {
    setPlaneSel(plane);
    const first = rowsInPlane(res.rows, plane)[0];
    if (first) setSelected(first.index);
  };
  const loadLabel = load.every(Number.isInteger) ? (
    <Idx v={load as unknown as [number, number, number]} />
  ) : (
    <span className="mono">[{load.map((x) => f(x, 3)).join(' ')}]</span>
  );

  const scene = useMemo(
    () => (res.rows.length ? buildSystemsScene({ structure, load, plane: sel?.plane, direction: sel?.direction }) : null),
    [structure, load, sel, res.rows.length],
  );
  const other = useMemo(() => computeSystems({ structure: otherStructure(structure), load, stress, crss, unit }), [structure, load, stress, crss, unit]);

  const openInSimulator = (row: SystemRow) => {
    loadSlipSystem(row.plane, row.direction, load, { loadType: 'tension', stressMode: 'stress', stress, stressUnit: unit, crss, crssUnit: unit });
    navigate(ROUTES.schmid);
  };

  return (
    <div className={sim.page}>
      <header className={sim.pageHead}>
        <div>
          <p className={sim.eyebrow}>Simulación avanzada</p>
          <h1 className={sim.pageTitle}>Sistemas de deslizamiento FCC y BCC</h1>
          <p className={sim.pageLead}>
            Para una dirección de carga, calcula el factor de Schmid de los 12 sistemas de la estructura y los ordena del más favorable al menos favorable.
          </p>
        </div>
        <Segmented
          ariaLabel="Estructura"
          value={structure}
          onChange={setStructure}
          options={[
            { value: 'FCC', label: <>FCC · <Idx v={[1, 1, 1]} kind="planeFamily" /><Idx v={[1, 1, 0]} kind="directionFamily" /></> },
            { value: 'BCC', label: <>BCC · <Idx v={[1, 1, 0]} kind="planeFamily" /><Idx v={[1, 1, 1]} kind="directionFamily" /></> },
          ]}
        />
      </header>

      <div className={sim.layout}>
        <div className={sim.stickyView}>
          <Viewport
            onResetView={() => setViewKey((k) => k + 1)}
            legend={
              <ul className={styles.legend}>
                {[[PALETTE.load, 'Dirección de carga'], [PALETTE.plane, 'Plano del sistema'], [PALETTE.normal, 'Normal n̂'], [PALETTE.slip, 'Dirección de deslizamiento d̂']].map(([c, t]) => (
                  <li key={t}><span style={{ background: c }} />{t}</li>
                ))}
              </ul>
            }
            overlay={res.rows.length === 0 ? <p className={sim.error}>{res.errors[0]}</p> : undefined}
          >
            {scene && <Scene3D scene={scene} viewKey={viewKey} ariaLabel={`Celda ${structure} con la dirección de carga y el sistema seleccionado`} />}
          </Viewport>
        </div>

        <aside className={sim.side}>
          <PanelCard title="Dirección de carga">
            <div className={sim.stack}>
              <IndexInput label="Esfuerzo aplicado a lo largo de [a b c]" value={load} onChange={setLoad} integer={false} letters={['a', 'b', 'c']} color={PALETTE.load} />
              <Chips label="Direcciones de carga" items={LOADS.map((v) => ({ label: <Idx v={v} />, value: v as Vec3 }))} onPick={setLoad} />
            </div>
          </PanelCard>

          <PanelCard title="Esfuerzos">
            <div className={sim.stack}>
              <div className={styles.twoCols}>
                <label className={sim.field}>
                  <span className={sim.fieldLabel}>σ aplicado</span>
                  <span className={sim.unitRow}><NumInput value={stress} onChange={setStress} min={0} step={1} ariaLabel="Esfuerzo aplicado" className={sim.grow} /></span>
                </label>
                <label className={sim.field}>
                  <span className={sim.fieldLabel}>τCRSS</span>
                  <span className={sim.unitRow}><NumInput value={crss} onChange={setCrss} min={0} step={1} ariaLabel="Esfuerzo cortante crítico" className={sim.grow} /></span>
                </label>
              </div>
              <Segmented ariaLabel="Unidad" value={unit} onChange={setUnit} options={(['Pa', 'MPa', 'GPa'] as const).map((u) => ({ value: u, label: u }))} />
              {res.errors.filter((e) => !e.startsWith('La dirección')).map((e) => <p key={e} className={sim.error}>{e}</p>)}
            </div>
          </PanelCard>

          <PanelCard title="Resumen">
            <table className={sim.results}>
              <tbody>
                <tr><th>Familia de sistemas</th><td>{structure} {res.family}</td></tr>
                <tr data-strong="true"><th>m máximo</th><td>{f(res.mMax)}</td></tr>
                <tr><th>Sistemas primarios (empatados)</th><td>{res.primary.length}</td></tr>
                <tr><th>σ de fluencia = τCRSS / m<sub>máx</sub></th><td>{res.yieldStress === null ? '—' : `${f(res.yieldStress)} ${unit}`}</td></tr>
                <tr><th>Sistemas activados con σ = {f(stress)} {unit}</th><td>{res.activeCount} de {res.rows.length}</td></tr>
              </tbody>
            </table>
          </PanelCard>

          {sel && (
            <PanelCard title="Sistema seleccionado">
              <div className={sim.stack}>
                <p className={styles.selTitle}>
                  <Idx v={sel.plane} kind="plane" />
                  <Idx v={sel.direction} />
                  <span className={styles.rankTag}>lugar {sel.rank}</span>
                </p>
                <table className={sim.results}>
                  <tbody>
                    <tr><th>φ · λ</th><td>{f(sel.schmid.phiAcuteDeg, 3)}° · {f(sel.schmid.lambdaAcuteDeg, 3)}°</td></tr>
                    <tr><th>m</th><td>{f(sel.schmid.mAbs)}</td></tr>
                    <tr><th>τR</th><td>{f(sel.tau)} {unit}</td></tr>
                    <tr><th>σ para activarlo</th><td>{Number.isFinite(sel.sigmaToActivate) ? `${f(sel.sigmaToActivate)} ${unit}` : '∞ (m = 0)'}</td></tr>
                  </tbody>
                </table>
                <button type="button" className={sim.button} data-primary="true" onClick={() => openInSimulator(sel)}>
                  Ver en el simulador de Schmid →
                </button>
              </div>
            </PanelCard>
          )}
        </aside>
      </div>

      {res.rows.length > 0 && (
        <section className={styles.tableCard} aria-labelledby="tabla-sistemas">
          <div className={styles.viewTabs}>
            <Segmented
              ariaLabel="Forma de consultar los resultados"
              value={view}
              onChange={setView}
              options={[
                { value: 'plane', label: 'Analizar un plano' },
                { value: 'ranking', label: 'Ranking de los 12 sistemas' },
              ]}
            />
          </div>
          {view === 'plane' ? (
            <>
              <header className={styles.tableHead}>
                <h2 id="tabla-sistemas">Direcciones de deslizamiento de un plano para la carga {loadLabel}</h2>
                <p>Elige un plano de deslizamiento para ver sus direcciones y sus factores de Schmid. Haz clic en una fila para verla en 3D.</p>
              </header>
              <PlaneAnalysis
                structure={structure}
                rows={res.rows}
                unit={unit}
                plane={planeSel}
                onPlane={choosePlane}
                selected={selected}
                onSelect={setSelected}
                onSimulate={openInSimulator}
              />
            </>
          ) : (
          <>
          <header className={styles.tableHead}>
            <h2 id="tabla-sistemas">
              Los 12 sistemas {structure} {res.family} para la carga{' '}
              {load.every(Number.isInteger) ? <Idx v={load as unknown as [number, number, number]} /> : <span className="mono">[{load.map((x) => f(x, 3)).join(' ')}]</span>}
            </h2>
            <p>Haz clic en una fila para verla en 3D. Las filas resaltadas son los sistemas primarios: los primeros en deslizar al aumentar la carga.</p>
          </header>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Lugar</th>
                  <th>Sistema</th>
                  <th>φ</th>
                  <th>λ</th>
                  <th className={styles.mCol}>Factor de Schmid |m|</th>
                  <th>τR ({unit})</th>
                  <th>Estado</th>
                  <th>σ para activar ({unit})</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {res.rows.map((r, k) => (
                  <tr
                    key={systemKey(r.plane, r.direction)}
                    data-primary={res.primary.includes(k)}
                    data-selected={k === selected}
                    onClick={() => setSelected(k)}
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelected(k))}
                    aria-selected={k === selected}
                  >
                    <td className={styles.rank}>{r.rank}</td>
                    <td className={styles.sys}><Idx v={r.plane} kind="plane" /><Idx v={r.direction} /></td>
                    <td>{f(r.schmid.phiAcuteDeg, 3)}°</td>
                    <td>{f(r.schmid.lambdaAcuteDeg, 3)}°</td>
                    <td className={styles.mCol}>
                      <span className={styles.bar}><span style={{ width: `${(r.schmid.mAbs / 0.5) * 100}%` }} /></span>
                      <span className={styles.mVal}>{f(r.schmid.mAbs)}</span>
                    </td>
                    <td>{f(r.tau)}</td>
                    <td><span className={styles.badge} data-state={r.state}>{STATE_TEXT[r.state]}</span></td>
                    <td>{Number.isFinite(r.sigmaToActivate) ? f(r.sigmaToActivate) : '∞'}</td>
                    <td>
                      <button type="button" className={styles.rowButton} onClick={(e) => { e.stopPropagation(); openInSimulator(r); }} title="Abrir este sistema en el simulador de Schmid">
                        Simular
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={sim.hint}>La barra de |m| se escala respecto al máximo teórico 0.5. Los sistemas con m = 0 no pueden deslizar con esta carga, sin importar σ.</p>
          </>
          )}
        </section>
      )}

      <div className={styles.bottom}>
        <section className={styles.infoCard}>
          <h2>¿Por qué unos sistemas se activan antes que otros?</h2>
          <p>
            Todos los sistemas sienten el mismo esfuerzo σ, pero cada uno recibe una fracción distinta como cortante: <strong>τR = σ·m</strong>. Como τCRSS es
            igual para todos los sistemas de la misma familia, el primero en alcanzarlo es el de <strong>mayor m</strong>: el sistema primario.
          </p>
          <p>
            Si varios sistemas empatan en m (por ejemplo, 8 sistemas FCC con carga en <Idx v={[1, 0, 0]} />), se activan a la vez: es el
            <strong> deslizamiento múltiple</strong>. Con orientaciones menos simétricas, como <Idx v={[1, 2, 3]} />, un solo sistema se activa primero:
            <strong> deslizamiento simple</strong>.
          </p>
          <p>
            Prueba a aumentar σ: los sistemas cambian de «No activado» a «Próximo» y luego a «Activado», siempre en el orden de la tabla.
          </p>
        </section>

        {sel && res.rows.length > 0 && (
          <Callout kind="curiosity" title="Dato curioso: la simetría FCC ↔ BCC">
            <p>
              Los sistemas FCC <Idx v={[1, 1, 1]} kind="planeFamily" /><Idx v={[1, 1, 0]} kind="directionFamily" /> y BCC{' '}
              <Idx v={[1, 1, 0]} kind="planeFamily" /><Idx v={[1, 1, 1]} kind="directionFamily" /> son las mismas familias con los papeles del plano y la
              dirección intercambiados. Como m = (ê·n̂)(ê·d̂) no cambia al intercambiar n̂ y d̂, cada sistema tiene un gemelo con el mismo factor de Schmid.
            </p>
            <p>
              El sistema seleccionado {structure} <Idx v={sel.plane} kind="plane" /><Idx v={sel.direction} /> tiene como gemelo al sistema {sel.twin.structure}{' '}
              <Idx v={sel.twin.plane} kind="plane" /><Idx v={sel.twin.direction} />, ambos con m = {f(sel.schmid.mAbs)}.
            </p>
            <div className={styles.twinLists}>
              {[
                { s: structure, rows: res.rows },
                { s: otherStructure(structure), rows: other.rows },
              ].map((col) => (
                <div key={col.s}>
                  <strong>{col.s}</strong>
                  <ol>{col.rows.map((r) => <li key={systemKey(r.plane, r.direction)} className="mono">{f(r.schmid.mAbs)}</li>)}</ol>
                </div>
              ))}
            </div>
            <p>
              {res.symmetryHolds ? '✓ ' : ''}Para esta carga, las dos listas de factores de Schmid son idénticas. Por eso el factor de Schmid, por sí solo, no permite
              distinguir si un cristal cúbico es FCC o BCC.
            </p>
          </Callout>
        )}
      </div>
    </div>
  );
}
