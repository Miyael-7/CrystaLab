import { SchmidDiagram } from '../../components/diagrams/SchmidDiagram';
import { Callout } from '../../components/ui/Callout';
import { Figure, Panel } from '../../components/ui/Figure';
import { Idx } from '../../components/ui/Idx';
import { Tex } from '../../components/ui/Tex';
import { fccBccSchmidSymmetry, formatNumber, rankSlipSystems, schmidFactor, stressToActivate } from '../../core';
import type { LibraryChapter } from './types';

// Ejemplos calculados en vivo con el núcleo (mismos valores que docs/validacion.md).
const exFcc = schmidFactor([1, 1, 1], [1, -1, 0], [1, 0, 0]);
const exBcc = schmidFactor([1, 1, 0], [-1, 1, 1], [1, 2, 1]);
const sigmaBcc = stressToActivate(82.73, exBcc.m);
const bcc123 = rankSlipSystems('BCC', [1, 2, 3]);
const sym = fccBccSchmidSymmetry([1, 2, 3]);
const f = (x: number, s = 4) => formatNumber(x, s);

export const schmidChapter: LibraryChapter = {
  id: 'schmid',
  number: 'II',
  title: 'Ley de Schmid',
  intro: (
    <p>
      Cómo un esfuerzo uniaxial aplicado a un monocristal produce un esfuerzo cortante en cada sistema de
      deslizamiento, y cuándo ese cortante basta para iniciar la deformación plástica.
    </p>
  ),
  sections: [
    {
      id: 'deformacion-plastica',
      title: 'Deformación plástica por deslizamiento',
      sources: ['clase', 'complemento'],
      content: (
        <>
          <p>
            La deformación <strong>elástica</strong> es recuperable: los átomos se separan un poco y regresan a su
            posición al retirar la carga. La deformación <strong>plástica</strong> es permanente. En los metales
            cristalinos ocurre principalmente por <strong>deslizamiento</strong>: una parte del cristal se desplaza
            respecto a otra a lo largo de ciertos planos y en ciertas direcciones.
          </p>
          <p>
            El deslizamiento lo produce un esfuerzo <strong>cortante</strong>. Para que ocurra, la fuerza tiene que tener
            una componente que actúe en el plano de deslizamiento y orientada en la dirección de deslizamiento. Una
            fuerza perpendicular a la dirección de deslizamiento no produce corte en ella.
          </p>
        </>
      ),
    },
    {
      id: 'dislocaciones',
      title: 'Dislocaciones',
      sources: ['complemento'],
      content: (
        <>
          <p>
            Si todos los átomos de un plano se desplazaran a la vez, el esfuerzo necesario sería de aproximadamente{' '}
            <Tex>{'G/30'}</Tex> a <Tex>{'G/10'}</Tex> (G es el módulo de corte). Los metales reales fluyen con esfuerzos cientos o miles de
            veces menores. La diferencia se explica por las <strong>dislocaciones</strong>: defectos lineales que
            permiten que el deslizamiento avance un enlace a la vez, como una arruga que se empuja a lo largo de una
            alfombra.
          </p>
          <p>
            Hay dos tipos básicos: la dislocación de <strong>borde</strong> (un semiplano extra de átomos) y la de{' '}
            <strong>tornillo</strong>. Ambas se mueven en el plano de deslizamiento, y su vector de Burgers coincide con
            la dirección de deslizamiento. El esfuerzo cortante crítico resuelto es, en el fondo, el esfuerzo necesario
            para mover dislocaciones.
          </p>
        </>
      ),
    },
    {
      id: 'sistemas',
      title: 'Planos, direcciones y sistemas de deslizamiento',
      sources: ['clase', 'complemento'],
      content: (
        <>
          <p>
            Generalmente existe un plano preferido, el <strong>plano de deslizamiento</strong>, y en él direcciones
            específicas por las que se mueven las dislocaciones: las <strong>direcciones de deslizamiento</strong>. Un
            plano junto con una dirección contenida en él forma un <strong>sistema de deslizamiento</strong>.
          </p>
          <Callout kind="key">
            <p>
              El plano de deslizamiento es el de mayor densidad atómica de la estructura, y la dirección de
              deslizamiento es la más densamente empaquetada dentro de ese plano.
            </p>
          </Callout>
          <div className="tableWrap">
            <table>
              <thead>
                <tr><th>Estructura</th><th>Planos</th><th>Direcciones</th><th>Sistemas</th></tr>
              </thead>
              <tbody>
                <tr><td>FCC</td><td><Idx v={[1, 1, 1]} kind="planeFamily" /> (4 planos)</td><td><Idx v={[1, 1, 0]} kind="directionFamily" /> (3 por plano)</td><td>12</td></tr>
                <tr><td>BCC</td><td><Idx v={[1, 1, 0]} kind="planeFamily" /> (6 planos)</td><td><Idx v={[1, 1, 1]} kind="directionFamily" /> (2 por plano)</td><td>12</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            Una dirección y su opuesta están sobre la misma recta, así que cuentan como un solo sistema. El sentido del
            deslizamiento lo determina el signo del esfuerzo cortante.
          </p>
          <Callout kind="note" title="Más allá del curso">
            <p>
              Los metales BCC también pueden deslizar en las familias <Idx v={[1, 1, 2]} kind="planeFamily" /> y{' '}
              <Idx v={[1, 2, 3]} kind="planeFamily" />, siempre en direcciones <Idx v={[1, 1, 1]} kind="directionFamily" />.
              Muchos metales hexagonales (HCP), como Zn, Mg y Cd, deslizan sobre todo en el plano basal; otros, como Ti y Zr, en planos prismáticos. CrystaLab se limita a los sistemas principales
              FCC y BCC.
            </p>
          </Callout>
        </>
      ),
    },
    {
      id: 'angulos',
      title: 'La normal y los ángulos φ y λ',
      sources: ['clase'],
      content: (
        <>
          <p>La orientación del sistema respecto al eje de carga se describe con dos ángulos:</p>
          <ul>
            <li>
              <strong style={{ color: 'var(--c-phi)' }}>φ</strong>: ángulo entre el eje de carga y la{' '}
              <strong>normal</strong> al plano de deslizamiento.
            </li>
            <li>
              <strong style={{ color: 'var(--c-lambda)' }}>λ</strong>: ángulo entre el eje de carga y la{' '}
              <strong>dirección</strong> de deslizamiento.
            </li>
          </ul>
          <Figure caption="Izquierda: caso general, donde φ + λ ≠ 90°. Derecha: caso especial, con el eje de carga en el plano formado por la normal y la dirección de deslizamiento (φ + λ = 90°).">
            <Panel label="Caso general">
              <SchmidDiagram title="Caso general: φ = 38°, λ = 62°" phi={38} lambda={62} width={260} />
            </Panel>
            <Panel label="Caso especial (coplanar)">
              <SchmidDiagram title="Caso coplanar: φ = 45°, λ = 45°" phi={45} lambda={45} width={260} />
            </Panel>
          </Figure>
          <p>En un cristal cúbico, ambos ángulos se calculan con vectores normalizados:</p>
          <Tex block>{'\\cos\\varphi = \\hat e\\cdot\\hat n = \\frac{a h + b k + c l}{\\sqrt{a^2+b^2+c^2}\\,\\sqrt{h^2+k^2+l^2}} \\qquad \\cos\\lambda = \\hat e\\cdot\\hat d = \\frac{a u + b v + c w}{\\sqrt{a^2+b^2+c^2}\\,\\sqrt{u^2+v^2+w^2}}'}</Tex>
          <p>
            Aquí [abc] es la dirección del esfuerzo, (hkl) el plano y [uvw] la dirección de deslizamiento.
          </p>
          <Callout kind="warning" title="φ y λ no suman 90° en general">
            <p>
              Como la normal es perpendicular a la dirección de deslizamiento, siempre se cumple{' '}
              <Tex>{'\\varphi + \\lambda \\geq 90^\\circ'}</Tex>. La igualdad solo ocurre en el caso especial en que el eje
              de carga está en el plano que forman la normal y la dirección. Unos datos con{' '}
              <Tex>{'\\varphi + \\lambda < 90^\\circ'}</Tex> describen una orientación imposible.
            </p>
          </Callout>
        </>
      ),
    },
    {
      id: 'deduccion',
      title: 'Deducción de la Ley de Schmid',
      sources: ['clase'],
      content: (
        <>
          <p>
            Sea una probeta cilíndrica de sección transversal <Tex>{'A_0'}</Tex> sometida a una fuerza axial F. El
            esfuerzo aplicado es:
          </p>
          <Tex block>{'\\sigma = \\frac{F}{A_0}, \\qquad A_0 = \\frac{\\pi d^2}{4}'}</Tex>
          <ol>
            <li>
              <strong>Fuerza en la dirección de deslizamiento.</strong> Solo actúa la componente de F a lo largo de la
              dirección de deslizamiento: <Tex>{'F_r = F\\cos\\lambda'}</Tex>.
            </li>
            <li>
              <strong>Área del plano de deslizamiento.</strong> El plano está inclinado, así que su área es mayor que la
              de la sección transversal: <Tex>{'A_1 = A_0/\\cos\\varphi'}</Tex>. Dicho al revés, la sección transversal
              es la proyección del plano: <Tex>{'A_0 = A_1\\cos\\varphi'}</Tex>.
            </li>
            <li>
              <strong>Esfuerzo cortante resuelto.</strong> Es la fuerza resuelta entre el área sobre la que actúa:
            </li>
          </ol>
          <Tex block>{'\\tau_R = \\frac{F_r}{A_1} = \\frac{F\\cos\\lambda}{A_0/\\cos\\varphi} = \\frac{F}{A_0}\\cos\\varphi\\cos\\lambda = \\sigma\\cos\\varphi\\cos\\lambda'}</Tex>
          <Callout kind="note" title="Notación">
            <p>
              Algunas fuentes llaman <Tex>{'\\alpha'}</Tex> al ángulo normal–eje y <Tex>{'\\beta'}</Tex> al ángulo
              dirección–eje, y escriben <Tex>{'A_0 = A\\cos\\alpha'}</Tex>. Es la misma ley:{' '}
              <Tex>{'\\alpha \\equiv \\varphi'}</Tex> y <Tex>{'\\beta \\equiv \\lambda'}</Tex>. En CrystaLab,{' '}
              <Tex>{'\\sigma'}</Tex> es siempre el esfuerzo <strong>normal</strong> aplicado y <Tex>{'\\tau'}</Tex> el
              esfuerzo <strong>cortante</strong>.
            </p>
          </Callout>
        </>
      ),
    },
    {
      id: 'factor-schmid',
      title: 'Factor de Schmid',
      sources: ['clase'],
      content: (
        <>
          <p>El producto de los dos cosenos depende solo de la geometría y se llama factor de Schmid:</p>
          <Tex block>{'m = \\cos\\varphi\\,\\cos\\lambda \\qquad\\Longrightarrow\\qquad \\tau_R = \\sigma\\,m'}</Tex>
          <ul>
            <li>
              <Tex>{'0 \\le |m| \\le 0.5'}</Tex>. El máximo, <Tex>{'m = 0.5'}</Tex>, ocurre con{' '}
              <Tex>{'\\varphi = \\lambda = 45^\\circ'}</Tex> en el caso coplanar. Entonces <Tex>{'\\tau_R = \\sigma/2'}</Tex>.
            </li>
            <li>
              <Tex>{'m = 0'}</Tex> si <Tex>{'\\varphi = 90^\\circ'}</Tex> (la carga es paralela al plano) o si{' '}
              <Tex>{'\\lambda = 90^\\circ'}</Tex> (la carga es perpendicular a la dirección). En ambos casos ese sistema no
              puede deslizar, por grande que sea σ.
            </li>
            <li>No depende del tamaño de la probeta: escalar los índices o cambiar el diámetro no lo modifica.</li>
          </ul>
          <Callout kind="example" title={`Ejemplo · FCC con carga en [100]`}>
            <p>
              Sistema <Idx v={[1, 1, 1]} kind="plane" /><Idx v={[1, -1, 0]} />, con el esfuerzo paralelo a{' '}
              <Idx v={[1, 0, 0]} />:
            </p>
            <Tex block>{`\\cos\\varphi = \\tfrac{1}{\\sqrt3},\\quad \\cos\\lambda = \\tfrac{1}{\\sqrt2}\\quad\\Rightarrow\\quad \\varphi = ${f(exFcc.phiAcuteDeg)}^\\circ,\\ \\lambda = ${f(exFcc.lambdaAcuteDeg)}^\\circ,\\ m = \\tfrac{1}{\\sqrt6} = ${f(exFcc.mAbs, 3)}`}</Tex>
          </Callout>
        </>
      ),
    },
    {
      id: 'crss',
      title: 'Esfuerzo cortante crítico resuelto',
      sources: ['clase'],
      content: (
        <>
          <p>
            El <strong>esfuerzo cortante crítico resuelto</strong>, <Tex>{'\\tau_{CRSS}'}</Tex>, es el cortante mínimo
            que se necesita sobre un sistema para iniciar el deslizamiento. Es una propiedad del material: depende de su
            pureza, de la temperatura y de la densidad de dislocaciones, pero no de la orientación. El criterio de Schmid
            es:
          </p>
          <Tex block>{'|\\tau_R| \\geq \\tau_{CRSS} \\quad\\Longleftrightarrow\\quad \\text{el sistema desliza}'}</Tex>
          <p>
            Despejando, el esfuerzo normal con el que fluye el monocristal es{' '}
            <Tex>{'\\sigma_y = \\tau_{CRSS}/m_{\\max}'}</Tex>, donde <Tex>{'m_{\\max}'}</Tex> es el factor de Schmid más
            alto entre todos los sistemas.
          </p>
          <Callout kind="example" title="Ejemplo · BCC con carga en [121]">
            <p>
              Sistema <Idx v={[1, 1, 0]} kind="plane" /><Idx v={[-1, 1, 1]} />, con{' '}
              <Tex>{'\\tau_{CRSS} = 82.73\\ \\text{MPa}'}</Tex>:
            </p>
            <Tex block>{`\\varphi = ${f(exBcc.phiAcuteDeg)}^\\circ,\\quad \\lambda = ${f(exBcc.lambdaAcuteDeg)}^\\circ,\\quad m = ${f(exBcc.mAbs, 3)}\\quad\\Rightarrow\\quad \\sigma = \\frac{82.73}{${f(exBcc.mAbs, 3)}} = ${f(sigmaBcc)}\\ \\text{MPa}`}</Tex>
          </Callout>
          <Callout kind="note" title="Signo del esfuerzo cortante">
            <p>
              Con σ positivo en tensión y negativo en compresión, <Tex>{'\\tau_R = \\sigma(\\hat e\\cdot\\hat n)(\\hat e\\cdot\\hat d)'}</Tex>{' '}
              tiene signo. Pasar de tensión a compresión invierte el <em>sentido</em> del corte, pero no su magnitud.
              Por eso la activación se decide con <Tex>{'|\\tau_R|'}</Tex>.
            </p>
          </Callout>
        </>
      ),
    },
    {
      id: 'activacion',
      title: 'Activación de los sistemas de deslizamiento',
      sources: ['clase'],
      content: (
        <>
          <p>
            Todos los sistemas de un cristal sienten el mismo σ, pero cada uno tiene su propio m. Al aumentar la carga,
            el primero en alcanzar <Tex>{'\\tau_{CRSS}'}</Tex> es el de mayor <Tex>{'|m|'}</Tex>: el{' '}
            <strong>sistema primario</strong>. Si la orientación es desfavorable para él, o si el esfuerzo sigue
            aumentando, se activan otros sistemas que requieren esfuerzos mayores.
          </p>
          <Callout kind="example" title="Ejemplo · BCC {110}<111> con carga en [123]">
            <p>Los cuatro sistemas más favorables, calculados por CrystaLab:</p>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr><th>Lugar</th><th>Sistema</th><th>φ</th><th>λ</th><th>|m|</th></tr>
                </thead>
                <tbody>
                  {bcc123.slice(0, 4).map((r, i) => (
                    <tr key={i}>
                      <td>{r.rank}</td>
                      <td><Idx v={r.plane} kind="plane" /><Idx v={r.direction} /></td>
                      <td>{f(r.schmid.phiAcuteDeg, 3)}°</td>
                      <td>{f(r.schmid.lambdaAcuteDeg, 3)}°</td>
                      <td>{f(r.schmid.mAbs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Al aumentar el esfuerzo a lo largo de <Idx v={[1, 2, 3]} />, el primer sistema en deslizar es{' '}
              <Idx v={bcc123[0]!.plane} kind="plane" /><Idx v={bcc123[0]!.direction} />. La tabla completa de los 12
              sistemas está en la sección <em>Sistemas FCC / BCC</em>.
            </p>
          </Callout>
        </>
      ),
    },
    {
      id: 'simetria',
      title: 'Dato curioso: la simetría FCC ↔ BCC',
      sources: ['complemento'],
      content: (
        <>
          <Callout kind="curiosity">
            <p>
              Los sistemas FCC son <Idx v={[1, 1, 1]} kind="planeFamily" /><Idx v={[1, 1, 0]} kind="directionFamily" /> y
              los BCC son <Idx v={[1, 1, 0]} kind="planeFamily" /><Idx v={[1, 1, 1]} kind="directionFamily" />: las mismas
              familias con los papeles del plano y la dirección intercambiados. Como{' '}
              <Tex>{'m = \\cos\\varphi\\cos\\lambda = (\\hat e\\cdot\\hat n)(\\hat e\\cdot\\hat d)'}</Tex> no cambia al
              intercambiar <Tex>{'\\hat n'}</Tex> y <Tex>{'\\hat d'}</Tex>, cada sistema FCC tiene un «gemelo» BCC con
              exactamente el mismo factor de Schmid.
            </p>
            <p>
              Consecuencia: para cualquier dirección de carga, FCC y BCC tienen el mismo conjunto de factores de Schmid.
              Con la carga en <Idx v={[1, 2, 3]} />, el máximo es {f(sym.fcc[0]!)} en ambas estructuras. Por eso el
              factor de Schmid, por sí solo, no permite distinguir si un cristal cúbico es FCC o BCC: hace falta otra
              información, como τCRSS, la densidad o la difracción.
            </p>
          </Callout>
        </>
      ),
    },
  ],
};
