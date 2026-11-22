# Guía para publicar CrystaLab en GitHub Pages

Al terminar esta guía tendrás un enlace público, por ejemplo `https://TU-USUARIO.github.io/crystalab/`, que cualquiera puede abrir desde una computadora, tableta o teléfono, sin instalar nada y sin cuenta de GitHub.

**Cómo funciona.** Tu código vive en un repositorio de GitHub. Cada vez que subes cambios (`git push`), GitHub Actions ejecuta las pruebas, compila la app y la publica en GitHub Pages de forma automática.

> En esta guía, `TU-USUARIO` es tu nombre de usuario de GitHub. Los comandos se escriben en una terminal: **PowerShell** en Windows o **Terminal** en macOS, dentro de la carpeta `crystalab`.

---

## Paso 0. Herramientas (una sola vez)

1. **Node.js (versión LTS):** <https://nodejs.org> → botón «LTS» → instalar con las opciones predeterminadas.
2. **Git:** <https://git-scm.com/downloads> → instalar con las opciones predeterminadas.
3. **Cuenta de GitHub:** <https://github.com/signup>, si aún no la tienes.
4. Cierra y vuelve a abrir la terminal, y comprueba:

   ```bash
   node -v        # v20.19 o mayor (ideal: v22 o v24)
   git --version
   ```

5. Configura tu identidad en Git, con el mismo correo de tu cuenta de GitHub:

   ```bash
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu-correo@ejemplo.com"
   ```

## Paso 1. Preparar la carpeta final del proyecto

Usa el paquete final `crystalab-final.zip`. Contiene el proyecto completo y limpio, sin la carpeta `.git`, sin `node_modules` y sin archivos sobrantes de etapas anteriores.

**Caso A: nunca has subido el proyecto a GitHub, o prefieres empezar limpio.**

1. Descomprime `crystalab-final.zip`. Obtienes una carpeta `crystalab`.
2. Entra a ella desde la terminal y crea el repositorio local:

   ```bash
   cd ruta/a/crystalab
   git init -b main
   ```

**Caso B: ya tienes la carpeta `crystalab` con su historial de Git** (de las etapas anteriores).

1. En tu carpeta `crystalab`, **borra** la carpeta `src` completa y los archivos `index.html`, `package.json`, `README.md`, `tsconfig.json` y `vite.config.ts`, y la carpeta `docs`. **No borres** la carpeta oculta `.git`, `node_modules` ni `package-lock.json`.

   > ¿Por qué borrar `src`? Al copiar archivos encima, los que se eliminaron en la versión final no desaparecen solos. Por ejemplo, `src/components/ui/StagePlaceholder.tsx` ya no se usa. Si reemplazas la carpeta completa, no queda nada de más.

2. Descomprime `crystalab-final.zip` en otro lugar y copia **todo su contenido** dentro de tu carpeta `crystalab`, incluida la carpeta `.github`.

   > En macOS, las carpetas que empiezan con punto están ocultas; pulsa `Cmd + Shift + .` en Finder para verlas. En Windows: Explorador → Vista → Mostrar → Elementos ocultos.

**En ambos casos, comprueba que la carpeta tenga exactamente esto:**

```
crystalab/
├─ .github/workflows/deploy.yml
├─ .gitignore
├─ README.md
├─ docs/                (3 archivos .md)
├─ index.html
├─ package.json
├─ public/favicon.svg
├─ src/                 (77 archivos)
├─ tsconfig.json
└─ vite.config.ts
```

En el Caso B también tendrás `.git`, `node_modules` y `package-lock.json`. Es correcto.

Para contar los archivos de `src`:

- macOS: `find src -type f | wc -l`
- Windows (PowerShell): `(Get-ChildItem src -Recurse -File).Count`

Debe dar **77**.

## Paso 2. Probar en tu computadora

```bash
npm install     # descarga las dependencias (1 a 3 minutos la primera vez)
npm test        # deben aprobarse 203 pruebas
npm run build   # debe terminar sin errores ("✓ built in …")
npm run dev     # abre http://localhost:5173 en el navegador
```

Revisa rápidamente Inicio, Miller, Schmid, Sistemas FCC/BCC y Biblioteca, y detén el servidor con `Ctrl + C`.

> `npm install` crea o actualiza `package-lock.json`. **Debe subirse a GitHub**, porque fija las versiones exactas para que GitHub compile lo mismo que tú.

## Paso 3. Crear el repositorio en GitHub

*(En el Caso B, si ya creaste el repositorio antes, salta al Paso 4.)*

1. Entra a <https://github.com> → botón **«+»** (arriba a la derecha) → **New repository**.
2. **Repository name:** `crystalab`. Puedes usar otro nombre; la app funciona igual y solo cambia el enlace.
3. **Visibility: Public.** GitHub Pages es gratuito solo para repositorios públicos.
4. **No** marques «Add a README file», «.gitignore» ni «license»: el proyecto ya los trae.
5. Pulsa **Create repository** y copia la dirección que aparece: `https://github.com/TU-USUARIO/crystalab.git`.

## Paso 4. Subir el código

**Caso A (repositorio nuevo):**

```bash
git add .
git commit -m "CrystaLab: versión final"
git remote add origin https://github.com/TU-USUARIO/crystalab.git
git push -u origin main
```

**Caso B (ya tenías historial y repositorio remoto):**

```bash
git add -A
git commit -m "Etapa 6: validación final, correcciones y publicación"
git push
```

`git add -A` registra también los archivos que borraste en el Paso 1, de modo que desaparecen del repositorio.

**Si GitHub pide iniciar sesión:**

- Normalmente se abre una ventana del navegador para autorizar. Acéptala.
- Si la terminal pide un **password**, tu contraseña normal no sirve. Crea un token en GitHub → foto de perfil → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**. Marca el permiso **repo** y **workflow**, y pega el token como contraseña.
- **Alternativa sin terminal:** instala **GitHub Desktop** (<https://desktop.github.com>) → *File → Add local repository* → elige la carpeta `crystalab` → *Publish repository*. Desmarca «Keep this code private».

## Paso 5. Activar GitHub Pages (una sola vez)

1. En tu repositorio de GitHub: pestaña **Settings** → menú lateral **Pages**.
2. En **Build and deployment → Source**, elige **GitHub Actions**. No elijas «Deploy from a branch».
3. Ve a la pestaña **Actions**. Verás el flujo **«Desplegar en GitHub Pages»**:
   - 🟡 Amarillo: en proceso (1 a 3 minutos).
   - ✅ Verde: publicado.
   - ❌ Rojo: falló (ver «Problemas frecuentes»).
4. Si no aparece ninguna ejecución, entra a **Actions → Desplegar en GitHub Pages → Run workflow → Run workflow**.

## Paso 6. Obtener y compartir el enlace

Cuando el flujo esté en verde:

- El enlace aparece en **Settings → Pages** («Your site is live at …») y también en la ejecución del flujo, dentro del paso *deploy*.
- Tiene la forma **`https://TU-USUARIO.github.io/crystalab/`**.

Para tenerlo siempre a la mano:

1. En la página principal del repositorio, pulsa el engrane ⚙️ junto a **About**.
2. Marca «Use your GitHub Pages website» y guarda.
3. Sustituye `TU-USUARIO` en la primera línea de `README.md` por tu enlace real, escribe los nombres del equipo en «Autoría», y sube el cambio:

   ```bash
   git add README.md
   git commit -m "Enlace público y autoría"
   git push
   ```

**Comprueba el enlace** en una ventana privada o de incógnito del navegador y en tu teléfono (con datos móviles, fuera de tu red). Cualquiera puede abrirlo sin cuenta de GitHub.

## Paso 7. Actualizar la app en el futuro

Cada cambio se publica solo:

```bash
npm test
git add -A
git commit -m "Describe el cambio"
git push
```

Si alguna prueba falla, GitHub **no publica** la nueva versión y el sitio conserva la anterior. Así nunca se publica una versión con cálculos rotos.

---

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `npm install` falla o advierte sobre la versión de Node | Instala la versión LTS de Node.js (Paso 0) y vuelve a intentar. |
| `npm run build` muestra errores | Copia el mensaje completo; indica el archivo y la línea. Revisa que la carpeta coincida con el Paso 1. |
| El flujo falla en «Instalar dependencias» | Falta `package-lock.json` o no coincide con `package.json`. Ejecuta `npm install` en tu computadora y sube ambos archivos. |
| El flujo falla en «Pruebas unitarias» | Ejecuta `npm test` en tu computadora para ver qué prueba falla. |
| El flujo falla en «Publicar en GitHub Pages» con un error de permisos o de entorno | En **Settings → Pages**, la fuente debe ser **GitHub Actions** (Paso 5). Vuelve a ejecutar el flujo. |
| Error 404 al abrir el enlace | Espera 1 a 2 minutos tras la primera publicación y recarga. Comprueba que el enlace termine en `/crystalab/` (o el nombre de tu repositorio). |
| La página se ve en blanco | Abre la consola del navegador (`F12` → Consola) y revisa el error. Comprueba que el flujo terminó en verde. |
| El modelo 3D no aparece y sale «No se pudo mostrar el modelo 3D» | El navegador no tiene WebGL activo. Actualízalo o activa la aceleración por hardware. Los cálculos siguen funcionando. |
| `git push` es rechazado (`rejected`, `fetch first`) | El repositorio en GitHub tiene archivos que tu carpeta no tiene, por ejemplo si creaste un README en GitHub. Ejecuta `git pull origin main --allow-unrelated-histories`, luego `git push`. |
| `remote origin already exists` | Ya estaba configurado. Usa `git remote set-url origin https://github.com/TU-USUARIO/crystalab.git`. |
| `.github` no se subió | Las carpetas con punto están ocultas; muéstralas (Paso 1) y vuelve a copiarla. Sin ella, GitHub no sabe cómo publicar. |

## Notas técnicas

- La app usa rutas con `#` (por ejemplo `…/crystalab/#/schmid`). Así GitHub Pages nunca devuelve 404 al recargar una sección, y cada sección se puede compartir con su propio enlace.
- `vite.config.ts` usa `base: './'`, así que la app funciona con cualquier nombre de repositorio, sin configurar rutas.
- Todo se calcula en el navegador: no hay servidor, base de datos ni servicios de pago. GitHub Pages es gratuito para repositorios públicos.
