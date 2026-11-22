import { PanelCard } from '../../components/sim/Controls';
import sim from '../../components/sim/Sim.module.css';
import { Idx } from '../../components/ui/Idx';
import { formatNumber, paTo, type Indices } from '../../core';
import type { SchmidInputs, SchmidModel } from '../../sim/schmidModel';

const f = (x: number, s = 4) => formatNumber(x, s);

/** Detalle de signos: ángulos entre vectores, cosenos con signo y sentido del deslizamiento. */
export function SignDetails({ inp, model }: { inp: SchmidInputs; model: SchmidModel }) {
  const v = model.vector!;
  const u = model.displayUnit;
  const tauSigned = model.sigmaPa === null ? null : paTo(model.sigmaPa * v.m, u);
  const neg = inp.dir.map((x) => -x || 0) as unknown as Indices;
  return (
    <PanelCard title="Magnitud y signo">
      <details className={sim.details}>
        <summary>Ver proyecciones vectoriales con signo</summary>
        <table className={sim.results} style={{ marginTop: 10 }}>
          <tbody>
            <tr><th>φ entre vectores ê y n̂</th><td>{f(v.phiDeg)}°</td></tr>
            <tr><th>λ entre vectores ê y d̂</th><td>{f(v.lambdaDeg)}°</td></tr>
            <tr><th>ê · n̂ (cos φ con signo)</th><td>{f(v.cosPhi)}</td></tr>
            <tr><th>ê · d̂ (cos λ con signo)</th><td>{f(v.cosLambda)}</td></tr>
            <tr><th>m con signo</th><td>{f(v.m)}</td></tr>
            {tauSigned !== null && <tr><th>σ (ê·n̂)(ê·d̂)</th><td>{f(tauSigned)} {u}</td></tr>}
          </tbody>
        </table>
        <p style={{ marginTop: 10 }}>
          El signo depende del sentido elegido para <Idx v={inp.plane} kind="plane" /> y <Idx v={inp.dir} /> y del tipo de carga, pero la magnitud no cambia.
          La activación se evalúa con |τR|.
        </p>
        <p className={sim.info}>
          En {inp.loadType === 'tension' ? 'tensión' : 'compresión'}, la parte superior de la probeta tiende a deslizarse en el sentido{' '}
          <strong><Idx v={v.upperSense > 0 ? inp.dir : neg} /></strong> respecto a la inferior.
        </p>
      </details>
    </PanelCard>
  );
}

/** Explicación breve de cada resultado. */
export function SchmidExplanations() {
  return (
    <PanelCard title="¿Qué significa cada resultado?">
      <details className={sim.details}>
        <summary>Mostrar explicaciones</summary>
        <dl>
          <dt>Normal al plano n̂</dt>
          <dd>Vector perpendicular al plano de deslizamiento. En un cristal cúbico es paralela a [hkl].</dd>
          <dt>φ</dt>
          <dd>Ángulo entre el eje de carga y la normal al plano. Determina cuánto se «inclina» el plano respecto a la carga.</dd>
          <dt>λ</dt>
          <dd>Ángulo entre el eje de carga y la dirección de deslizamiento. Determina qué parte de la fuerza actúa en esa dirección.</dd>
          <dt>Factor de Schmid m = cos φ cos λ</dt>
          <dd>Fracción del esfuerzo aplicado que llega como cortante al sistema. Va de 0 a 0.5; el máximo ocurre con φ = λ = 45°.</dd>
          <dt>Esfuerzo cortante resuelto τR = σ m</dt>
          <dd>Esfuerzo cortante que actúa sobre el plano, en la dirección de deslizamiento. Su signo indica el sentido del corte.</dd>
          <dt>τCRSS</dt>
          <dd>Propiedad del material: el cortante mínimo para mover dislocaciones en ese sistema.</dd>
          <dt>Estado</dt>
          <dd>Criterio de Schmid: el sistema desliza cuando |τR| ≥ τCRSS. «Próximo» indica que |τR| ya supera el 90 % de τCRSS.</dd>
          <dt>σ para iniciar el deslizamiento</dt>
          <dd>Esfuerzo aplicado con el que este sistema alcanzaría τCRSS: σ = τCRSS / m.</dd>
        </dl>
      </details>
    </PanelCard>
  );
}
