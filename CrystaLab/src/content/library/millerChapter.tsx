import { CellDiagram } from '../../components/diagrams/CellDiagram';
import { Callout } from '../../components/ui/Callout';
import { Figure, Panel } from '../../components/ui/Figure';
import { Idx } from '../../components/ui/Idx';
import { Tex } from '../../components/ui/Tex';
import { familyMembers } from '../../core';
import type { LibraryChapter } from './types';

const P = 'var(--c-plane)';
const G = 'var(--c-slip)';
const B = 'var(--c-normal)';
const Rd = 'var(--c-load)';

export const millerChapter: LibraryChapter = {
  id: 'miller',
  number: 'I',
  title: 'Índices de Miller',
  intro: (
    <p>
      Notación cristalográfica para nombrar direcciones y planos dentro de un cristal. Todo lo que sigue se refiere a
      cristales <strong>cúbicos</strong>, que son los que usa CrystaLab.
    </p>
  ),
  sections: [
    {
      id: 'celda-unitaria',
      title: 'Celda unitaria y ejes cristalográficos',
      sources: ['clase'],
      content: (
        <>
          <p>
            Un cristal es un arreglo periódico de átomos. La <strong>celda unitaria</strong> es el bloque que,
            repetido en las tres direcciones del espacio, reproduce todo el cristal. Se elige la celda que mejor muestra
            la simetría de la estructura; por eso las celdas FCC y BCC son cubos, aunque no sean las celdas más pequeñas
            posibles (esas son las celdas primitivas). En el sistema cúbico sus tres aristas miden lo mismo
            (<Tex>{'a = b = c'}</Tex>) y forman ángulos rectos entre sí.
          </p>
          <p>
            Los ejes <em>x</em>, <em>y</em> y <em>z</em> (en algunos textos <Tex>{'\\vec a_1, \\vec a_2, \\vec a_3'}</Tex>)
            parten de un vértice que se toma como origen. Las coordenadas de cualquier punto se expresan en fracciones de
            la arista, de modo que la celda ocupa de 0 a 1 en cada eje.
          </p>
          <Figure caption="Celda unitaria cúbica 1 × 1 × 1 con sus ejes y las coordenadas de los vértices. Las aristas punteadas quedan detrás.">
            <CellDiagram title="Celda unitaria cúbica con coordenadas de los vértices" coords width={340} />
          </Figure>
        </>
      ),
    },
    {
      id: 'direcciones',
      title: 'Direcciones cristalográficas [uvw]',
      sources: ['clase'],
      content: (
        <>
          <p>
            Una dirección es la recta que une dos puntos de la red, es decir, un vector. Se escribe con tres enteros
            entre corchetes y sin comas: <Idx v={[1, 1, 0]} />. Los índices negativos se escriben con una barra encima:{' '}
            <Idx v={[-1, 1, 0]} /> se lee «menos uno, uno, cero».
          </p>
          <h4>Procedimiento</h4>
          <ol>
            <li>Establece el origen de la celda unitaria.</li>
            <li>
              Determina las proyecciones del vector sobre los tres ejes. Equivale a restar las coordenadas de la{' '}
              <strong>punta</strong> menos las del <strong>inicio</strong>.
            </li>
            <li>Multiplica o divide por un mismo número para obtener los enteros más pequeños posibles.</li>
            <li>Escribe los índices entre corchetes, sin comas.</li>
          </ol>
          <Callout kind="example" title="Ejemplo 1 · Resta de coordenadas">
            <p>
              Un vector va de <Tex>{'(1, 0, 0)'}</Tex> a <Tex>{'(0, 1, 1)'}</Tex>. Punta menos inicio:{' '}
              <Tex>{'(0-1,\\ 1-0,\\ 1-0) = (-1, 1, 1)'}</Tex>. Ya son enteros, así que la dirección es{' '}
              <Idx v={[-1, 1, 1]} />.
            </p>
          </Callout>
          <Callout kind="example" title="Ejemplo 2 · Fracciones">
            <p>
              Un vector parte del origen y llega a <Tex>{'(\\tfrac12, 1, 0)'}</Tex>. Al multiplicar por 2 se obtiene{' '}
              <Tex>{'(1, 2, 0)'}</Tex>, por lo que la dirección es <Idx v={[1, 2, 0]} />.
            </p>
          </Callout>
          <Figure caption="Direcciones de índices bajos, con índices negativos y con componentes mayores que 1. El círculo marca el inicio del vector: en las direcciones con índices negativos, el origen se traslada. Comprueba que punta − inicio da los índices.">
            <Panel label={<><Idx v={[1, 0, 0]} />, <Idx v={[1, 1, 0]} />, <Idx v={[1, 1, 1]} /></>}>
              <CellDiagram
                title="Direcciones [100], [110] y [111]"
                directions={[
                  { uvw: [1, 0, 0], color: Rd, label: true },
                  { uvw: [1, 1, 0], color: G, label: true },
                  { uvw: [1, 1, 1], color: B, label: true },
                ]}
                width={240}
              />
            </Panel>
            <Panel label={<><Idx v={[-1, 1, 0]} /> y <Idx v={[-1, -1, 1]} /></>}>
              <CellDiagram
                title="Direcciones con índices negativos"
                directions={[
                  { uvw: [-1, 1, 0], color: G, label: true, endpoints: true },
                  { uvw: [-1, -1, 1], color: B, label: true, endpoints: true },
                ]}
                width={240}
              />
            </Panel>
            <Panel label={<Idx v={[1, 2, 3]} />}>
              <CellDiagram title="Dirección [123] escalada para caber en la celda" directions={[{ uvw: [1, 2, 3], color: P, label: true, endpoints: true }]} width={240} />
            </Panel>
          </Figure>
          <p>
            Para dibujar una dirección con algún índice negativo, el origen se traslada a la esquina donde esa
            coordenada vale 1. Si algún índice es mayor que 1, se dibuja el vector dividido entre el índice mayor:{' '}
            <Idx v={[1, 2, 3]} /> llega a <Tex>{'(\\tfrac13, \\tfrac23, 1)'}</Tex>. La orientación y los índices no
            cambian.
          </p>
          <Callout kind="note">
            <p>
              <Idx v={[2, 2, 2]} /> y <Idx v={[1, 1, 1]} /> son la misma dirección. Se usan siempre los enteros más
              pequeños. En cambio, <Idx v={[-1, -1, -1]} /> es la dirección opuesta: está sobre la misma recta, pero
              tiene el sentido contrario.
            </p>
          </Callout>
        </>
      ),
    },
    {
      id: 'familias-direcciones',
      title: 'Familias de direcciones <uvw>',
      sources: ['clase'],
      content: (
        <>
          <p>
            Una <strong>familia de direcciones</strong> es el conjunto de direcciones equivalentes por la simetría del
            cristal. Se escribe entre paréntesis angulares: <Idx v={[1, 1, 0]} kind="directionFamily" />. En un cristal
            cúbico, los miembros se obtienen al permutar los índices y cambiarles el signo.
          </p>
          <div className="tableWrap">
            <table>
              <thead>
                <tr><th>Familia</th><th>Direcciones</th><th>Total</th></tr>
              </thead>
              <tbody>
                {([[1, 0, 0], [1, 1, 0], [1, 1, 1]] as const).map((f) => {
                  const m = familyMembers(f);
                  return (
                    <tr key={f.join()}>
                      <td><Idx v={f} kind="directionFamily" /></td>
                      <td className="idxList">{m.map((d, i) => <Idx key={i} v={d} />)}</td>
                      <td>{m.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p>
            Un material tiene las mismas propiedades en todas las direcciones de una familia. Esto importa porque, por
            ejemplo, los metales se deforman con facilidad en las direcciones donde los átomos están en contacto más
            estrecho, y las propiedades magnéticas del hierro dependen de la dirección cristalográfica.
          </p>
        </>
      ),
    },
    {
      id: 'planos',
      title: 'Planos cristalográficos (hkl)',
      sources: ['clase'],
      content: (
        <>
          <p>
            Los planos se especifican con tres enteros entre paréntesis: <Idx v={[1, 1, 1]} kind="plane" />. Los planos
            paralelos son equivalentes y tienen los mismos índices de Miller.
          </p>
          <h4>Procedimiento</h4>
          <ol>
            <li>Si el plano pasa por el origen, elige un nuevo origen (o un plano paralelo) para que no lo haga.</li>
            <li>Determina dónde corta el plano a cada uno de los <strong>tres</strong> ejes. Si es paralelo a un eje, lo corta en ∞.</li>
            <li>Toma los recíprocos de las intersecciones. El recíproco de ∞ es 0.</li>
            <li>Reduce a los enteros más pequeños.</li>
            <li>Escribe los índices entre paréntesis, sin comas.</li>
          </ol>
          <Callout kind="example" title="Ejemplo 1 · Plano (120)">
            <p>
              Intersecciones: <Tex>{'x = 1,\\ y = \\tfrac12,\\ z = \\infty'}</Tex>. Recíprocos:{' '}
              <Tex>{'1,\\ 2,\\ 0'}</Tex>. El plano es <Idx v={[1, 2, 0]} kind="plane" />.
            </p>
          </Callout>
          <Callout kind="example" title="Ejemplo 2 · Un plano que pasa por el origen">
            <p>
              El plano que contiene los puntos <Tex>{'(0,0,0)'}</Tex>, <Tex>{'(1,1,0)'}</Tex> y <Tex>{'(1,0,1)'}</Tex>{' '}
              pasa por el origen. Trasladamos el origen a <Tex>{'(1,0,0)'}</Tex>. Desde ahí, las intersecciones son{' '}
              <Tex>{'x = -1,\\ y = 1,\\ z = 1'}</Tex>, cuyos recíprocos son <Tex>{'-1,\\ 1,\\ 1'}</Tex>. El plano es{' '}
              <Idx v={[-1, 1, 1]} kind="plane" />.
            </p>
          </Callout>
          <Figure caption="Planos de índices bajos. Los puntos marcan las intersecciones con los ejes medidas desde el origen (trasladado si hace falta).">
            <Panel label={<Idx v={[1, 0, 0]} kind="plane" />}>
              <CellDiagram title="Plano (100)" planes={[{ hkl: [1, 0, 0], color: P, intercepts: true }]} width={200} />
            </Panel>
            <Panel label={<Idx v={[1, 1, 0]} kind="plane" />}>
              <CellDiagram title="Plano (110)" planes={[{ hkl: [1, 1, 0], color: P, intercepts: true }]} width={200} />
            </Panel>
            <Panel label={<Idx v={[1, 1, 1]} kind="plane" />}>
              <CellDiagram title="Plano (111)" planes={[{ hkl: [1, 1, 1], color: P, intercepts: true }]} width={200} />
            </Panel>
            <Panel label={<Idx v={[1, 2, 0]} kind="plane" />}>
              <CellDiagram title="Plano (120)" planes={[{ hkl: [1, 2, 0], color: B, intercepts: true }]} width={200} />
            </Panel>
            <Panel label={<Idx v={[-1, 1, 1]} kind="plane" />}>
              <CellDiagram title="Plano (−1 1 1) dibujado desde el origen trasladado" planes={[{ hkl: [-1, 1, 1], color: G, intercepts: true }]} width={200} />
            </Panel>
          </Figure>
          <Callout kind="note">
            <p>
              A diferencia de las direcciones, <Idx v={[1, 1, 1]} kind="plane" /> y{' '}
              <Idx v={[-1, -1, -1]} kind="plane" /> describen el mismo conjunto de planos paralelos.
            </p>
          </Callout>
        </>
      ),
    },
    {
      id: 'familias-planos',
      title: 'Familias de planos {hkl}',
      sources: ['clase'],
      content: (
        <>
          <p>
            Una <strong>familia de planos</strong> agrupa los planos que son equivalentes por la simetría del cristal.
            Tienen la misma distribución y el mismo espaciado de átomos, aunque estén orientados de forma distinta. Se
            escribe entre llaves: <Idx v={[1, 1, 1]} kind="planeFamily" />.
          </p>
          <p>
            Por ejemplo, la familia <Idx v={[1, 0, 0]} kind="planeFamily" /> de un cristal cúbico reúne las caras{' '}
            <Idx v={[1, 0, 0]} kind="plane" />, <Idx v={[0, 1, 0]} kind="plane" /> y <Idx v={[0, 0, 1]} kind="plane" />.
            Planos de familias distintas tienen <strong>densidades atómicas superficiales</strong> distintas. Esa
            diferencia es la clave para entender en qué planos ocurre el deslizamiento.
          </p>
          <Figure caption="Familia {111} en un cristal cúbico: cuatro orientaciones distintas de planos equivalentes.">
            {([[1, 1, 1], [-1, 1, 1], [1, -1, 1], [1, 1, -1]] as const).map((h) => (
              <Panel key={h.join()} label={<Idx v={h} kind="plane" />}>
                <CellDiagram title={`Plano de la familia {111}`} planes={[{ hkl: h, color: P }]} axes={false} width={150} />
              </Panel>
            ))}
          </Figure>
        </>
      ),
    },
    {
      id: 'normal-zona',
      title: 'Normal a un plano y direcciones contenidas en él',
      sources: ['complemento'],
      content: (
        <>
          <p>
            En un cristal <strong>cúbico</strong>, la dirección <Idx v={[1, 1, 1]} /> es perpendicular al plano{' '}
            <Idx v={[1, 1, 1]} kind="plane" />. En general, la normal al plano (hkl) es paralela a [hkl]:
          </p>
          <Tex block>{'\\hat n_{(hkl)} = \\frac{(h,\\,k,\\,l)}{\\sqrt{h^2 + k^2 + l^2}}'}</Tex>
          <p>
            Por lo mismo, una dirección [uvw] está contenida en el plano (hkl) cuando es perpendicular a su normal, es
            decir, cuando su producto punto es cero:
          </p>
          <Tex block>{'h\\,u + k\\,v + l\\,w = 0'}</Tex>
          <p>
            Por ejemplo, <Idx v={[1, -1, 0]} /> está en <Idx v={[1, 1, 1]} kind="plane" /> porque{' '}
            <Tex>{'1 - 1 + 0 = 0'}</Tex>. Esta condición es la que usa CrystaLab para validar un sistema de
            deslizamiento.
          </p>
          <p>
            El ángulo entre dos direcciones se obtiene del producto punto de los vectores normalizados:
          </p>
          <Tex block>{'\\cos\\theta = \\frac{u_1u_2 + v_1v_2 + w_1w_2}{\\sqrt{u_1^2+v_1^2+w_1^2}\\,\\sqrt{u_2^2+v_2^2+w_2^2}}'}</Tex>
          <Callout kind="warning">
            <p>
              La propiedad «normal de (hkl) ∥ [hkl]» solo se cumple en sistemas cúbicos. En sistemas no cúbicos
              (tetragonal, hexagonal, etc.) la normal se calcula con la red recíproca. Por eso CrystaLab se limita a
              cristales cúbicos.
            </p>
          </Callout>
        </>
      ),
    },
    {
      id: 'fcc-bcc',
      title: 'Estructuras FCC y BCC',
      sources: ['clase', 'complemento'],
      content: (
        <>
          <p>
            Las dos estructuras cúbicas más comunes en los metales son la cúbica centrada en las caras (<strong>FCC</strong>)
            y la cúbica centrada en el cuerpo (<strong>BCC</strong>). Sus planos y direcciones más compactos son los que
            definen sus sistemas de deslizamiento.
          </p>
          <Figure caption="Posiciones atómicas en las celdas FCC (esquinas y centros de las caras) y BCC (esquinas y centro del cuerpo).">
            <Panel label="FCC con el plano (111)">
              <CellDiagram title="Celda FCC con el plano (111)" atoms="fcc" planes={[{ hkl: [1, 1, 1], color: P }]} width={250} />
            </Panel>
            <Panel label="BCC con el plano (110)">
              <CellDiagram title="Celda BCC con el plano (110)" atoms="bcc" planes={[{ hkl: [1, 1, 0], color: P }]} width={250} />
            </Panel>
          </Figure>
          <div className="tableWrap">
            <table>
              <thead>
                <tr><th></th><th>FCC</th><th>BCC</th></tr>
              </thead>
              <tbody>
                <tr><td>Átomos por celda</td><td>4</td><td>2</td></tr>
                <tr><td>Número de coordinación</td><td>12</td><td>8</td></tr>
                <tr><td>Parámetro de red (radio atómico R)</td><td><Tex>{'a = 2\\sqrt2\\,R'}</Tex></td><td><Tex>{'a = 4R/\\sqrt3'}</Tex></td></tr>
                <tr><td>Factor de empaquetamiento</td><td>0.74</td><td>0.68</td></tr>
                <tr><td>Planos más compactos</td><td><Idx v={[1, 1, 1]} kind="planeFamily" /></td><td><Idx v={[1, 1, 0]} kind="planeFamily" /></td></tr>
                <tr><td>Direcciones más compactas</td><td><Idx v={[1, 1, 0]} kind="directionFamily" /></td><td><Idx v={[1, 1, 1]} kind="directionFamily" /></td></tr>
                <tr><td>Ejemplos</td><td>Cu, Al, Ni, Ag, Au, Pb</td><td>Fe-α, Cr, Mo, W, Nb</td></tr>
              </tbody>
            </table>
          </div>
          <h4>Densidad planar</h4>
          <p>
            La densidad planar es el número de átomos cuyo centro está en un plano, dividido entre el área de ese plano
            dentro de la celda. Expresada con el radio atómico R:
          </p>
          <div className="tableWrap">
            <table>
              <thead>
                <tr><th>Estructura</th><th>Plano</th><th>Densidad planar</th></tr>
              </thead>
              <tbody>
                <tr><td>FCC</td><td><Idx v={[1, 0, 0]} kind="plane" /></td><td><Tex>{'\\dfrac{1}{4R^2}\\approx\\dfrac{0.25}{R^2}'}</Tex></td></tr>
                <tr><td>FCC</td><td><Idx v={[1, 1, 1]} kind="plane" /></td><td><Tex>{'\\dfrac{1}{2\\sqrt3\\,R^2}\\approx\\dfrac{0.29}{R^2}'}</Tex></td></tr>
                <tr><td>BCC</td><td><Idx v={[1, 0, 0]} kind="plane" /></td><td><Tex>{'\\dfrac{3}{16R^2}\\approx\\dfrac{0.19}{R^2}'}</Tex></td></tr>
                <tr><td>BCC</td><td><Idx v={[1, 1, 0]} kind="plane" /></td><td><Tex>{'\\dfrac{3}{8\\sqrt2\\,R^2}\\approx\\dfrac{0.27}{R^2}'}</Tex></td></tr>
              </tbody>
            </table>
          </div>
          <p>
            En FCC el plano <Idx v={[1, 1, 1]} kind="plane" /> es más denso que el <Idx v={[1, 0, 0]} kind="plane" />, y en
            BCC el <Idx v={[1, 1, 0]} kind="plane" /> lo es más que el <Idx v={[1, 0, 0]} kind="plane" />. El
            deslizamiento ocurre preferentemente en los planos más densos, que son también los más separados entre sí.
          </p>
        </>
      ),
    },
  ],
};
