/**
 * Vista «Analizar un plano» del comparador: elige un plano de deslizamiento y
 * muestra sus direcciones con los resultados que ya calcula computeSystems().
 */
import { useEffect, useState } from 'react';
import { IndexInput } from '../../components/sim/Controls';
import sim from '../../components/sim/Sim.module.css';
import { Idx } from '../../components/ui/Idx';
import { IndexText } from '../../components/ui/IndexText';
import { formatNumber, type Indices, type StressUnit, type Structure } from '../../core';
import { familyPlanes, matchFamilyPlane, rowsInPlane } from '../../sim/planeAnalysis';
import type { SystemRow } from '../../sim/systemsModel';
import { PALETTE } from '../../styles/palette';
import styles from './SlipSystemsPage.module.css';

const STATE_TEXT = { inactive: 'No activado', near: 'Próximo', active: 'Activado' } as const;
const f = (x: number, s = 4) => formatNumber(x, s);
const same = (a: Indices, b: Indices) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

interface Props {
  structure: Structure;
  rows: SystemRow[];
  unit: StressUnit;
  plane: Indices;
  onPlane: (plane: Indices) => void;
  selected: number;
  onSelect: (index: number) => void;
  onSimulate: (row: SystemRow) => void;
}

export function PlaneAnalysis({ structure, rows, unit, plane, onPlane, selected, onSelect, onSimulate }: Props) {
  const planes = familyPlanes(structure);
  // Campo para escribir un plano; se sincroniza cuando el plano cambia desde fuera.
  const [typed, setTyped] = useState<Indices>(plane);
  useEffect(() => {
    setTyped((t) => {
      const m = matchFamilyPlane(structure, t);
      return m.ok && same(m.plane, plane) ? t : plane;
    });
  }, [plane, structure]);
  const match = matchFamilyPlane(structure, typed);

  const inPlane = rowsInPlane(rows, plane);
  const first = inPlane[0]?.row;
  const best = inPlane.find(({ row }) => row.schmid.mAbs > 1e-12);

  return (
    <div className={styles.planeView}>
      <div className={styles.planePicker}>
        <div className={styles.planeChoices}>
          <span className={styles.pickerLabel}>
            Planos de deslizamiento {structure} {structure === 'FCC' ? <Idx v={[1, 1, 1]} kind="planeFamily" /> : <Idx v={[1, 1, 0]} kind="planeFamily" />}
          </span>
          <div className={styles.planeButtons} role="radiogroup" aria-label="Plano de deslizamiento">
            {planes.map((p) => (
              <button
                key={p.join()}
                type="button"
                role="radio"
                aria-checked={same(p, plane)}
                data-active={same(p, plane)}
                className={styles.planeButton}
                onClick={() => {
                  setTyped(p);
                  onPlane(p);
                }}
              >
                <Idx v={p} kind="plane" />
              </button>
            ))}
          </div>
        </div>
        <div className={styles.planeTyped}>
          <IndexInput
            label="O escribe el plano (h k l)"
            value={typed}
            kind="plane"
            letters={['h', 'k', 'l']}
            color={PALETTE.plane}
            onChange={(v) => {
              setTyped(v);
              const m = matchFamilyPlane(structure, v);
              if (m.ok) onPlane(m.plane);
            }}
          />
          {!match.ok && <p className={sim.error}><IndexText text={match.error} /></p>}
          {match.ok && match.equivalent && (
            <p className={sim.hint}>
              <Idx v={typed} kind="plane" /> es el mismo plano que <Idx v={match.plane} kind="plane" />.
            </p>
          )}
        </div>
      </div>

      {first && (
        <>
          <div className={styles.planeSummary}>
            <div>
              <span className={styles.sumLabel}>Plano</span>
              <span className={styles.sumValue}><Idx v={plane} kind="plane" /></span>
            </div>
            <div>
              <span className={styles.sumLabel}>φ (eje de carga ↔ normal)</span>
              <span className={styles.sumValue}>{f(first.schmid.phiAcuteDeg, 3)}°</span>
            </div>
            <div>
              <span className={styles.sumLabel}>cos φ</span>
              <span className={styles.sumValue}>{f(Math.abs(first.schmid.cosPhi))}</span>
            </div>
            <div>
              <span className={styles.sumLabel}>Dirección más favorable</span>
              <span className={styles.sumValue}>
                {best ? (
                  <>
                    <Idx v={best.row.direction} /> · m = {f(best.row.schmid.mAbs)}
                  </>
                ) : (
                  'ninguna (m = 0)'
                )}
              </span>
            </div>
          </div>
          {Math.abs(first.schmid.cosPhi) < 1e-12 && (
            <p className={sim.warning}>
              φ = 90°: la carga es paralela a este plano, así que ninguna de sus direcciones recibe esfuerzo cortante (m = 0).
            </p>
          )}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Dirección [uvw]</th>
                  <th>λ</th>
                  <th>cos λ</th>
                  <th className={styles.mCol}>m = cos φ · cos λ</th>
                  <th>τR ({unit})</th>
                  <th>Estado</th>
                  <th>σ para activar ({unit})</th>
                  <th>Lugar entre los 12</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {inPlane.map(({ row: r, index }) => (
                  <tr
                    key={r.direction.join()}
                    data-selected={index === selected}
                    onClick={() => onSelect(index)}
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(index))}
                    aria-selected={index === selected}
                  >
                    <td className={styles.sys}><Idx v={r.direction} /></td>
                    <td>{f(r.schmid.lambdaAcuteDeg, 3)}°</td>
                    <td>{f(Math.abs(r.schmid.cosLambda))}</td>
                    <td className={styles.mCol}>
                      <span className={styles.bar}><span style={{ width: `${(r.schmid.mAbs / 0.5) * 100}%` }} /></span>
                      <span className={styles.mVal}>{f(r.schmid.mAbs)}</span>
                    </td>
                    <td>{f(r.tau)}</td>
                    <td><span className={styles.badge} data-state={r.state}>{STATE_TEXT[r.state]}</span></td>
                    <td>{Number.isFinite(r.sigmaToActivate) ? f(r.sigmaToActivate) : '∞'}</td>
                    <td className={styles.rank}>{r.rank}</td>
                    <td>
                      <button type="button" className={styles.rowButton} onClick={(e) => { e.stopPropagation(); onSimulate(r); }} title="Abrir este sistema en el simulador de Schmid">
                        Simular
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={sim.hint}>
            φ es el mismo para todas las direcciones del plano, porque solo depende de su normal; lo que cambia de una dirección a otra es λ. Cada dirección
            representa también a su opuesta (por ejemplo, <Idx v={[1, -1, 0]} /> y <Idx v={[-1, 1, 0]} />): es la misma recta y el mismo sistema. «Lugar entre los 12» es la posición en el ranking completo.
          </p>
        </>
      )}
    </div>
  );
}
