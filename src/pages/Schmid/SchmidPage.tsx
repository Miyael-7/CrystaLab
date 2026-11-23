import { useEffect, useMemo, useState } from 'react';
import { ActivationMeter } from '../../components/sim/ActivationMeter';
import { Chips, IndexInput, NumInput, PanelCard, Segmented, UnitField } from '../../components/sim/Controls';
import { Viewport } from '../../components/sim/Viewport';
import sim from '../../components/sim/Sim.module.css';
import { ColorLegend } from '../../components/ui/ColorLegend';
import { Idx } from '../../components/ui/Idx';
import { IndexText } from '../../components/ui/IndexText';
import { Tex } from '../../components/ui/Tex';
import { formatNumber, isDirectionInPlane, paTo, slipOffset, type Indices } from '../../core';
import { useStore } from '../../lib/store';
import { buildSchmidScene } from '../../scenes/schmidScene';
import { LazyScene3D as Scene3D } from '../../scenes/LazyScene3D';
import { computeSchmid, type SchmidModel, type SchmidInputs } from '../../sim/schmidModel';
import { SCHMID_PRESETS, schmidStore } from '../../sim/schmidStore';
import { PALETTE } from '../../styles/palette';
import { SchmidExplanations, SignDetails } from './SchmidDetails';

const f = (x: number | null, s = 4) => (x === null ? '—' : formatNumber(x, s));
/** Número para KaTeX (signo menos ASCII). */
const t = (x: number, s = 4) => formatNumber(x, s).replace('−', '-');

export function SchmidPage() {
  const inp = useStore(schmidStore);
  const set = (p: Partial<SchmidInputs>) => schmidStore.set(p);
  const model = useMemo(() => computeSchmid(inp), [inp]);

  const [viewKey, setViewKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [finished, setFinished] = useState(false);

  const scene = useMemo(() => {
    if (!model.scene || model.phiDeg === null || model.lambdaDeg === null) return null;
    return buildSchmidScene({
      normal: model.scene.normal,
      slip: model.scene.slip,
      load: inp.loadType,
      phiDeg: model.phiDeg,
      lambdaDeg: model.lambdaDeg,
      state: model.state,
      rotation: model.scene.rotation,
      planeIdx: inp.mode === 'indices' ? inp.plane : undefined,
      dirIdx: inp.mode === 'indices' ? inp.dir : undefined,
    });
  }, [model, inp.loadType, inp.mode, inp.plane, inp.dir]);

  const canAnimate = model.state === 'active' && scene !== null;
  // Cualquier cambio en el sistema o en la carga reinicia la animación.
  const sceneKey = scene ? JSON.stringify([scene.normalUp, scene.slipUp, inp.loadType, canAnimate]) : '';
  useEffect(() => {
    setPlaying(false);
    setFinished(false);
    setResetToken((k) => k + 1);
  }, [sceneKey]);

  const offset = scene ? slipOffset(scene.slipUp, model.sigmaPa ?? 1, 1, 0.34) : ([0, 0, 0] as const);

  const examples = (
    <>
      <span className={sim.footerLabel}>Ejemplos</span>
      <div className={sim.footerScroll}>
        <Chips
          label="Ejemplos"
          items={SCHMID_PRESETS.filter((p) => (p.values.mode ?? 'indices') === inp.mode).map((p) => ({
            value: p,
            title: p.title,
            label: (
              <>
                {p.label}
                {p.values.plane && p.values.dir && (
                  <>
                    {' · '}
                    <Idx v={p.values.plane} kind="plane" />
                    <Idx v={p.values.dir} />
                  </>
                )}
              </>
            ),
          }))}
          onPick={(p) => set(p.values)}
        />
      </div>
    </>
  );

  const overlay = !scene ? (
    <div className={sim.stack}>
      {model.errors.length > 0 && <p className={sim.error}><IndexText text={model.errors[0]!} /></p>}
      {model.errors.length === 0 && !model.geometricallyPossible && (
        <p className={sim.warning}>Con φ + λ &lt; 90° no existe ninguna orientación real del cristal: no se puede dibujar. Revisa los ángulos.</p>
      )}
    </div>
  ) : undefined;

  return (
    <div className={sim.page}>
      <header className={sim.pageHead}>
        <div>
          <p className={sim.eyebrow}>Sección 3 · Simulador principal</p>
          <h1 className={sim.pageTitle}>Ley de Schmid</h1>
          <p className={sim.pageLead}>
            Define el sistema de deslizamiento y la carga. El modelo muestra la probeta, el plano, la normal, la dirección y los ángulos φ y λ; el panel calcula
            m, τR y si el sistema se activa.
          </p>
        </div>
        <Segmented
          ariaLabel="Forma de definir la orientación"
          value={inp.mode}
          onChange={(mode) => set({ mode })}
          options={[
            { value: 'indices', label: 'Por índices' },
            { value: 'angles', label: 'Por ángulos φ, λ' },
          ]}
        />
      </header>

      <div className={sim.layout}>
        <div className={sim.stickyView}>
          <Viewport onResetView={() => setViewKey((k) => k + 1)} legend={<ColorLegend compact />} overlay={overlay} footer={examples}>
            {scene && (
              <Scene3D
                scene={scene}
                viewKey={viewKey}
                ariaLabel="Probeta con el sistema de deslizamiento, la normal, la dirección de deslizamiento y los ángulos φ y λ"
                animation={{ offset, playing, resetToken, duration: 2.6, onDone: () => { setPlaying(false); setFinished(true); } }}
              />
            )}
          </Viewport>
        </div>

        <aside className={sim.side}>

          {inp.mode === 'indices' ? (
            <PanelCard title="Sistema de deslizamiento">
              <div className={sim.stack}>
                <IndexInput label="Plano (h k l)" value={inp.plane} onChange={(plane) => set({ plane })} kind="plane" letters={['h', 'k', 'l']} color={PALETTE.plane} />
                <IndexInput label="Dirección [u v w]" value={inp.dir} onChange={(dir) => set({ dir })} color={PALETTE.slip} />
                <IndexInput label="Dirección del esfuerzo [a b c]" value={inp.load} onChange={(load) => set({ load })} integer={false} letters={['a', 'b', 'c']} color={PALETTE.load} />
                <MembershipCheck plane={inp.plane} dir={inp.dir} />
              </div>
            </PanelCard>
          ) : (
            <PanelCard title="Orientación por ángulos">
              <div className={sim.stack}>
                <AngleField label="φ: eje de carga ↔ normal" value={inp.phi} onChange={(phi) => set({ phi })} color={PALETTE.phi} />
                <AngleField label="λ: eje de carga ↔ dirección" value={inp.lambda} onChange={(lambda) => set({ lambda })} color={PALETTE.lambda} />
                {model.warnings.map((w) => (
                  <p key={w} className={sim.warning}>{w}</p>
                ))}
              </div>
            </PanelCard>
          )}

          <PanelCard title="Carga aplicada">
            <div className={sim.stack}>
              <Segmented ariaLabel="Tipo de carga" value={inp.loadType} onChange={(loadType) => set({ loadType })}
                options={[{ value: 'tension', label: 'Tensión' }, { value: 'compression', label: 'Compresión' }]} />
              <Segmented ariaLabel="Forma de dar el esfuerzo" value={inp.stressMode} onChange={(stressMode) => set({ stressMode })}
                options={[{ value: 'stress', label: 'Esfuerzo σ' }, { value: 'force', label: 'Fuerza y área' }]} />
              {inp.stressMode === 'stress' ? (
                <UnitField label="Esfuerzo aplicado σ (magnitud)" value={inp.stress} unit={inp.stressUnit} units={['Pa', 'MPa', 'GPa'] as const}
                  onValue={(stress) => set({ stress })} onUnit={(stressUnit) => set({ stressUnit })} />
              ) : (
                <>
                  <UnitField label="Fuerza F (magnitud)" value={inp.force} unit={inp.forceUnit} units={['N', 'kN'] as const}
                    onValue={(force) => set({ force })} onUnit={(forceUnit) => set({ forceUnit })} />
                  <Segmented ariaLabel="Área transversal" value={inp.areaMode} onChange={(areaMode) => set({ areaMode })}
                    options={[{ value: 'diameter', label: 'Diámetro d' }, { value: 'area', label: 'Área A₀' }]} />
                  {inp.areaMode === 'diameter' ? (
                    <UnitField label="Diámetro de la probeta" value={inp.diameter} unit={inp.diameterUnit} units={['mm', 'cm', 'm'] as const}
                      onValue={(diameter) => set({ diameter })} onUnit={(diameterUnit) => set({ diameterUnit })} hint="A₀ = π d² / 4" />
                  ) : (
                    <UnitField label="Área transversal A₀" value={inp.area} unit={inp.areaUnit} units={['mm²', 'cm²', 'm²'] as const}
                      onValue={(area) => set({ area })} onUnit={(areaUnit) => set({ areaUnit })} />
                  )}
                </>
              )}
              <p className={sim.hint}>La geometría de la probeta solo cambia σ; el factor de Schmid depende únicamente de la orientación.</p>
            </div>
          </PanelCard>

          <PanelCard title="Material">
            <UnitField label="Esfuerzo cortante crítico resuelto τCRSS" value={inp.crss} unit={inp.crssUnit} units={['Pa', 'MPa', 'GPa'] as const}
              onValue={(crss) => set({ crss })} onUnit={(crssUnit) => set({ crssUnit })} />
          </PanelCard>

          <PanelCard title="Estado del sistema">
            <div className={sim.stack}>
              <ActivationMeter ratio={model.ratio} state={model.state} />
              <div className={sim.buttonRow}>
                <button type="button" className={sim.button} data-primary="true" disabled={!canAnimate || playing || finished} onClick={() => setPlaying(true)}>
                  Iniciar
                </button>
                <button type="button" className={sim.button} disabled={!playing} onClick={() => setPlaying(false)}>
                  Pausar
                </button>
                <button type="button" className={sim.button} disabled={!canAnimate} onClick={() => { setPlaying(false); setFinished(false); setResetToken((k) => k + 1); }}>
                  Reiniciar
                </button>
              </div>
              <p className={sim.hint}>
                {canAnimate
                  ? 'Animación conceptual: la mitad superior se desliza sobre el plano en la dirección de deslizamiento. No altera los resultados.'
                  : 'La animación del deslizamiento se habilita cuando |τR| ≥ τCRSS.'}
              </p>
            </div>
          </PanelCard>

          {model.errors.length > 0 && scene && (
            <div className={sim.stack}>{model.errors.map((e) => <p key={e} className={sim.error}><IndexText text={e} /></p>)}</div>
          )}

          <ResultsCard inp={inp} model={model} />
          <DerivationCard inp={inp} model={model} />
          {inp.mode === 'indices' && model.vector && <SignDetails inp={inp} model={model} />}
          <SchmidExplanations />
        </aside>
      </div>
    </div>
  );
}

function MembershipCheck({ plane, dir }: { plane: Indices; dir: Indices }) {
  const s = plane[0] * dir[0] + plane[1] * dir[1] + plane[2] * dir[2];
  const ok = isDirectionInPlane(plane, dir);
  return (
    <p className={ok ? sim.info : sim.error}>
      hu + kv + lw = {plane[0]}·({dir[0]}) + {plane[1]}·({dir[1]}) + {plane[2]}·({dir[2]}) = <strong>{s}</strong>{' '}
      {ok ? '✓ la dirección está en el plano.' : '✗ la dirección no está en el plano: no es un sistema de deslizamiento válido.'}
    </p>
  );
}

function AngleField({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <label className={sim.field}>
      <span className={sim.fieldLabel}>
        <span className={sim.dot} style={{ background: color }} aria-hidden="true" />
        {label}
      </span>
      <span className={sim.unitRow}>
        <NumInput value={value} onChange={onChange} step={0.1} min={0} max={90} ariaLabel={label} className={sim.grow} />
        <span className={sim.select} style={{ display: 'grid', placeItems: 'center' }}>grados</span>
      </span>
    </label>
  );
}

function ResultsCard({ inp, model }: { inp: SchmidInputs; model: SchmidModel }) {
  const u = model.displayUnit;
  const inU = (pa: number | null) => (pa === null ? null : paTo(pa, u));
  return (
    <PanelCard title="Resultados">
      <table className={sim.results}>
        <tbody>
          {inp.mode === 'indices' && (
            <>
              <tr><th>Plano · dirección</th><td><Idx v={inp.plane} kind="plane" /><Idx v={inp.dir} /></td></tr>
              <tr><th>Dirección del esfuerzo</th><td>[{inp.load.map((x) => f(x, 3)).join(' ')}]</td></tr>
              <tr><th>Normal al plano (cúbico)</th><td><Idx v={inp.plane} /></td></tr>
            </>
          )}
          <tr><th>Tipo de carga</th><td>{inp.loadType === 'tension' ? 'Tensión' : 'Compresión'}</td></tr>
          {model.forceN !== null && <tr><th>Fuerza F</th><td>{f(model.forceN)} N</td></tr>}
          {model.areaM2 !== null && <tr><th>Área A₀</th><td>{f(model.areaM2 * 1e6)} mm²</td></tr>}
          <tr><th><span className={sim.sym}>σ</span>esfuerzo aplicado</th><td>{f(inU(model.sigmaPa))} {u}</td></tr>
          <tr><th><span className={sim.sym}>τ<sub>CRSS</sub></span>crítico</th><td>{f(inU(model.crssPa))} {u}</td></tr>
          <tr><th><span className={sim.sym} style={{ color: 'var(--c-phi)' }}>φ</span>eje ↔ normal</th><td>{f(model.phiDeg)}°</td></tr>
          <tr><th><span className={sim.sym} style={{ color: 'var(--c-lambda)' }}>λ</span>eje ↔ dirección</th><td>{f(model.lambdaDeg)}°</td></tr>
          <tr><th>cos φ</th><td>{f(model.cosPhi)}</td></tr>
          <tr><th>cos λ</th><td>{f(model.cosLambda)}</td></tr>
          <tr data-strong="true"><th>Factor de Schmid m</th><td>{f(model.m)}</td></tr>
          <tr data-strong="true"><th><span className={sim.sym}>τ<sub>R</sub></span>cortante resuelto</th><td>{f(inU(model.tauPa))} {u}</td></tr>
          <tr><th>|τR|</th><td>{model.tauPa === null ? '—' : `${f(Math.abs(inU(model.tauPa)!))} ${u}`}</td></tr>
          <tr><th>σ para iniciar el deslizamiento</th><td>{model.sigmaToActivatePa === null ? '—' : Number.isFinite(model.sigmaToActivatePa) ? `${f(inU(model.sigmaToActivatePa))} ${u}` : '∞ (m = 0)'}</td></tr>
          <tr><th>Caso coplanar (φ + λ = 90°)</th><td>{model.m === null ? '—' : model.coplanar ? 'sí' : 'no'}</td></tr>
        </tbody>
      </table>
    </PanelCard>
  );
}

function DerivationCard({ inp, model }: { inp: SchmidInputs; model: SchmidModel }) {
  if (model.m === null || model.cosPhi === null || model.cosLambda === null || model.phiDeg === null || model.lambdaDeg === null) return null;
  const u = model.displayUnit;
  const eqs: string[] = [];
  const al = (lines: string[]) => `\\begin{aligned}${lines.join(' \\\\ ')}\\end{aligned}`;
  if (model.forceN !== null && model.areaM2 !== null) {
    const Amm = model.areaM2 * 1e6;
    if (inp.areaMode === 'diameter') {
      const dmm = model.areaM2 > 0 ? Math.sqrt((4 * model.areaM2) / Math.PI) * 1e3 : 0;
      eqs.push(al([`A_0 &= \\frac{\\pi d^2}{4} = \\frac{\\pi\\,(${t(dmm)}\\ \\text{mm})^2}{4}`, `&= ${t(Amm)}\\ \\text{mm}^2`]));
    }
    eqs.push(al([`\\sigma &= \\frac{F}{A_0} = \\frac{${t(model.forceN)}\\ \\text{N}}{${t(Amm)}\\ \\text{mm}^2}`, `&= ${t(Math.abs(paTo(model.sigmaPa!, 'MPa')))}\\ \\text{MPa}`]));
  }
  if (inp.mode === 'indices' && model.vector) {
    const a2 = inp.load.reduce((s, x) => s + x * x, 0);
    const h2 = inp.plane.reduce((s, x) => s + x * x, 0);
    const u2 = inp.dir.reduce((s, x) => s + x * x, 0);
    eqs.push(al([
      `\\cos\\varphi &= \\frac{|ah + bk + cl|}{\\sqrt{a^2+b^2+c^2}\\,\\sqrt{h^2+k^2+l^2}}`,
      `&= \\frac{${t(Math.abs(model.vector.dotNumPhi))}}{\\sqrt{${t(a2)}}\\,\\sqrt{${h2}}} = ${t(model.cosPhi)}`,
      `\\varphi &= ${t(model.phiDeg)}^\\circ`,
    ]));
    eqs.push(al([
      `\\cos\\lambda &= \\frac{|au + bv + cw|}{\\sqrt{a^2+b^2+c^2}\\,\\sqrt{u^2+v^2+w^2}}`,
      `&= \\frac{${t(Math.abs(model.vector.dotNumLambda))}}{\\sqrt{${t(a2)}}\\,\\sqrt{${u2}}} = ${t(model.cosLambda)}`,
      `\\lambda &= ${t(model.lambdaDeg)}^\\circ`,
    ]));
  } else {
    eqs.push(al([`\\cos\\varphi &= \\cos ${t(model.phiDeg)}^\\circ = ${t(model.cosPhi)}`, `\\cos\\lambda &= \\cos ${t(model.lambdaDeg)}^\\circ = ${t(model.cosLambda)}`]));
  }
  eqs.push(al([`m &= \\cos\\varphi\\,\\cos\\lambda`, `&= ${t(model.cosPhi)} \\times ${t(model.cosLambda)}`, `&= ${t(model.m)}`]));
  if (model.sigmaPa !== null && model.tauPa !== null) {
    const s = paTo(model.sigmaPa, u);
    eqs.push(al([`\\tau_R &= \\sigma\\,m`, `&= (${t(s)}\\ \\text{${u}}) \\times ${t(model.m)}`, `&= ${t(paTo(model.tauPa, u))}\\ \\text{${u}}`]));
    if (model.crssPa !== null) {
      const ge = Math.abs(model.tauPa) >= model.crssPa * (1 - 1e-12);
      eqs.push(al([`|\\tau_R| &= ${t(Math.abs(paTo(model.tauPa, u)))}\\ \\text{${u}}`, `&${ge ? '\\geq' : '<'}\\ \\tau_{CRSS} = ${t(paTo(model.crssPa, u))}\\ \\text{${u}}`]));
    }
  }
  return (
    <PanelCard title="Desarrollo">
      <div className={sim.stack}>
        {eqs.map((e, i) => (
          <div key={i} className={sim.equation}>
            <Tex block>{e}</Tex>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
