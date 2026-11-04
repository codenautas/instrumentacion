# CLAUDE.md — instrumentacion

Aplicación [backend-plus](https://github.com/codenautas/backend-plus) para inventariar la infraestructura: servidores, bases de datos, instancias de aplicaciones (`instapp`), repositorios, operativos, software de terceros y sus versiones, y responsables de backups. No depende de dmencu.

## Comandos

- `npm run build`: copia imágenes, compila cliente y servidor con `tsc` y corre `mixin-patch`. Falla si hay errores de tipos; no hay que volver a agregar `|| echo "continue with errors"`.
- `npm test`: build y tests con mocha (`tests/tests/*.js`). Los tests corren contra `dist/` y **no necesitan base de datos**.
- `npm start`: levanta el servidor (`dist/server/server-instrumentacion.js`). Necesita `local-config.yaml` con los datos de la base (ver `example-local-config.yaml`).
- `npm start -- --dump-db`: genera los scripts para crear la base vacía a partir de las definiciones de tablas y de `install/*.tab`.

## Estructura

- `src/server/app-instrumentacion.ts`: clase de la app (mixin sobre `AppBackend`): menú, registro de tablas (`prepareGetTables`) y servicios propios:
  - `/documentacion` (logueado): página HTML por operativo, armada con `contentPage`/`commonPage`.
  - `/ver` (sin login): muestra los datos del puesto y registra IP y user agent.
  - `/config/<instancia>[/<ambiente>]` (sin login, con token): devuelve el `local-config.yaml` de la instancia. Ver `docs/yaml-de-instancias.md`.
- `src/server/table-*.ts`: una función por tabla que devuelve su `TableDefinition`. Las de `*_reporte_consultora` y `databases_referentes_backups` son vistas (`sql.isTable:false`).
- `src/server/procedures-instrumentacion.ts`: procedures (`api_call`, provisorio; `show_databases_referentes_backups`).
- `src/server/def-config.ts`: configuración por defecto (puerto, base, login).
- `src/client/`: sin código propio; sólo CSS e imágenes de `/documentacion`.
- `install/`: datos iniciales (`*.tab`) y scripts SQL de cambios de estructura con fecha; `operaciones/`: scripts SQL de actualizaciones ya corridas.

## Agregar una tabla

1. Crear `src/server/table-<nombre>.ts` siguiendo las existentes (`editable: admin` salvo que se decida otra cosa).
2. Importarla y registrarla en `prepareGetTables` y, si corresponde, agregarla al menú en `getMenu`.
3. Si se cambia la estructura de una tabla existente, agregar el script de actualización en `operaciones/` (ver "Base de datos").
4. `tests/tests/estructura.js` verifica nombres, primary keys, foreign keys, detailTables, menú y permisos de edición.

## Convenciones de código

Reglas generales de los proyectos backend-plus (tomadas de dmencu) más las propias del proyecto.

### Tipos

- **Todos los tipos deben ser explícitos**. Prohibido usar `any`, `@ts-ignore`, casts vía `unknown` o cualquier magia sin justificación.
  - Si un callback recibe un parámetro sin tipo, tiparlo, no dejarlo implícito.
- El código de bajo nivel que inevitablemente viene sin tipar se encapsula en lugares acotados y se trata como excepción:
  - Las filas de `pg-promise-strict` (`fetchAll().rows`, `onRow`) vienen sin tipo: se convierten campo por campo a un tipo explícito (ver `filaDocumentacion` en `app-instrumentacion.ts`), no con `as`.
  - Única excepción a `any`: el constructor del mixin (`Constructor<T>` y `constructor(...args: any[])`), porque TypeScript lo exige (TS2545).
- Los handlers de Express usan `Request`/`Response` de backend-plus (vía `types-instrumentacion.ts`). Para que tipen hacen falta en devDependencies `@types/express-session` (el `Request` de backend-plus declara `session`) y `express-useragent` (trae los tipos de `req.useragent`).

### Formato

- **Preservar el estilo existente**, incluido el uso de `var` donde ya se usa.
- **No tocar el formato de lo que ya existe**: el diff de un cambio debe mostrar sólo las líneas que cambian de verdad.
  - No reindentar ni reformatear (`app-instrumentacion.ts` usa 2 espacios, las tablas 4); sólo corregir líneas claramente mal indentadas. No quitar ni agregar espacios al final de las líneas, ni el salto de línea final del archivo.
  - Respetar el fin de línea de cada archivo: la mayoría tiene CRLF pero hay algunos con LF. Las líneas nuevas van con el mismo fin de línea que el resto del archivo. Revisar con `git ls-files --eol <archivo>`.
  - En Windows no editar con `sed -i` ni con herramientas que reescriban el archivo completo, porque pueden convertir CRLF a LF.
  - Antes de commitear, comparar `git diff --stat` con `git diff --ignore-all-space --ignore-cr-at-eol --stat`. Si dan distinto, hay cambios de formato que hay que revertir.
- Nombres de tablas, columnas, variables de dominio y mensajes en castellano, consistentes con el esquema de la base.
- Los procedures (`action`) se nombran `objeto_accion`, con la acción siempre al final (`instancia_registrar`, no `registrar_instancia`).
- Seguir las convenciones de backend-plus para tablas, procedures y endpoints. Antes de trabajar con una tabla, leer su `table-*.ts`.

### Base de datos

- Las consultas se esperan siempre dentro del callback de `inDbClient`/`inTransaction`; la conexión se libera al salir del callback.
- En SQL, `when` (columna de `api_calls`) es palabra reservada: va entre comillas dobles.
- Formato de las consultas SQL escritas dentro del código (usando el espaciado del archivo, 2 espacios en `app-instrumentacion.ts`): la consulta va una sangría más adentro que la línea que la abre; el `select` queda una sangría más afuera que el resto (columnas, `from`, `join`, `where`, `order by`), y el cierre del template va a la altura del `select`. No hundirla hasta el borde derecho. Ejemplo:
  ```
  documentTextRow = (await client.query(`
    select *
      from textos_doc
      where codigo = $1
    `, [codigo]).fetchAll()).rows
  ```
- La columna `eliminado` de `databases` (oculta, `visible:false`) no se puede sacar de la definición: la usan los reportes `dbs_sin_instancia_reporte_consultora` y `servers_sin_dbs_ni_instancias_reporte_consultora`; sin ella fallan, y también en cualquier base nueva creada con el dump.
- Todos los objetos están en el esquema `instrumentacion`.
- Antes de cambiar una regla de negocio, buscar si está implementada en una función o trigger de PostgreSQL; no duplicarla en TypeScript.
- Los SQL de `install/` (listados en `def-config.ts`) sólo se aplican al instalar la base con el dump. Un cambio de estructura que tenga que llegar a bases ya instaladas lleva además un script en `operaciones/`:
  - Nombre `actualizarAAAA-MM-DD.sql` con la fecha del cambio (como todos los de `operaciones/`).
  - El formato es el que genera el dump (`npm start -- --dump-db`), para que una base actualizada quede igual a una creada de cero: empieza con `set search_path = "instrumentacion", public;`, los nombres de tablas y columnas van entre comillas dobles, y cada columna de texto nueva lleva su `check`, con el nombre que usa el dump:
    ```
    alter table "instapp" add column "policy" text;
    alter table "instapp" add constraint "policy<>''" check ("policy"<>'');
    ```
  - Una tabla nueva se escribe como el dump (ver `actualizar2025-07-25.sql`): `create table` con la primary key, los `grant` a `instrumentacion_user` o `instrumentacion_admin` y a `instrumentacion_owner`, los `check` de cada columna de texto y las foreign keys con `on update cascade`.
  - Los scripts se corren una sola vez por base, así que no llevan guardas (`if not exists`).

## Compilación

- **Sin fallbacks**: el build no tolera errores. No agregar `|| echo "continue w/error"` a los scripts de `package.json`; un error de compilación se corrige en el código.
- Si `mixin-patch` se cuelga sin salida, casi seguro hay un `.d.ts` viejo en `dist/` que dispara su regex (catastrophic backtracking). Solución: borrar `dist/` y volver a compilar.

## Tests

- Mocha, con `npm test`. Cada funcionalidad crítica que se agregue o extienda lleva sus tests.

## Dependencias a tener en cuenta

- `typescript` está fijado en una versión exacta. Un commit de 2025 indicaba que versiones posteriores a 5.4.5 dejaban el build en bucle; con 5.9.3 el build termina normalmente.
- `mixin-patch` ≥ 1.0.0 es necesario para compilar sin `local-config.yaml` (la 0.5.0 fallaba si no existía) y requiere Node ≥ 22.
