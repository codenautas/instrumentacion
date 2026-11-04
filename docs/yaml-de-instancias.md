# Yaml de las instancias y token de `/config`

Instrumentación arma el `local-config.yaml` de cada instancia registrada con los datos que ya tiene (servidor, puerto,
base, repositorio, etc.). Hay tres formas de obtenerlo:

| Cómo | Quién puede | Necesita token |
|---|---|---|
| Botón **ver yaml** en la grilla de `instapp` | usuarios con rol admin, logueados | no (usa la sesión) |
| Vista previa en la pantalla **registrar instancia** | usuarios con rol admin, logueados | no (usa la sesión) |
| Endpoint `GET /instrumentacion/config/<instancia>[/<ambiente>]` | cualquiera que tenga el token (se usa con `curl` desde un servidor) | **sí** |

Este documento explica la tercera.

## Qué devuelve

El yaml de la instancia: `server` (puerto, base-url, usuario), `git`, `db` (host, puerto, base, usuario, esquema),
`install.dump.db.owner`, `login.plus.successRedirect` (instancias dm) y `client-setup.background-img` (producción).

**No incluye** el password de la base ni `install.table-data-dir`. El archivo trae comentadas esas dos líneas
(`# db.password: agregar a mano`, `# install.table-data-dir: ...`) y se completan a mano en el servidor.

## Cómo se protege

El endpoint no pide login (se llama con `curl`), así que lo único que lo protege es un **token compartido**:

- Se define en el `local-config.yaml` de la **app de instrumentación**, en la clave `instrumentacion.config-token`.
- Quien llama lo manda en el header `x-token` (también se acepta `?token=`, pero queda en los logs: preferir el header).
- Respuestas:

| Código | Cuándo |
|---|---|
| 200 | el yaml de la instancia |
| 403 | el token no coincide |
| 404 | la instancia no existe, **o el token no está definido en la app** (el endpoint está apagado) |
| 409 | el nombre está en varios ambientes y no se indicó cuál (el mensaje los lista); ver "El ambiente" |
| 500 | error inesperado |

Es un único token para todos: si se filtra desde un servidor hay que cambiarlo en la app y en todos los demás.
Usar siempre https, porque el token viaja en cada pedido.

## Configuración (una sola vez)

1. Generar un token largo y al azar, por ejemplo `openssl rand -hex 32`.
2. Agregarlo al `local-config.yaml` de la app de instrumentación (hay un ejemplo en `example-local-config.yaml`) y reiniciarla:

   ```yaml
   instrumentacion:
     config-token: <el token>
   ```

3. En cada servidor desde el que se vayan a bajar yamls, guardarlo en un archivo que sólo lea el usuario:

   ```sh
   echo '<el token>' > /opt/insts/.token
   chmod 600 /opt/insts/.token
   ```

4. Verificar que nginx deje pasar la ruta `/instrumentacion/config/...` y el header `x-token`.

## Uso

Bajar el yaml de una instancia (sin pisar el archivo si falla, `-f` hace que `curl` falle ante un 4xx):

```sh
curl -fsS -H "x-token: $(cat /opt/insts/.token)" \
  "https://<dominio>/instrumentacion/config/etoi271" \
  -o /opt/insts/etoi271.yaml.tmp && mv /opt/insts/etoi271.yaml.tmp /opt/insts/etoi271.yaml
```

Alcanza con el nombre de la instancia. Después se completa el password (y `table-data-dir` si corresponde) y se hace el symlink
a `/opt/insts/<instancia>.yaml` como siempre.

## El ambiente

El nombre de la instancia alcanza en casi todos los casos, porque con la convención actual lo determina (`pr<operativo>` es
prueba, `capa<operativo>` es capacitación, sin prefijo es producción). Pero la clave de `instapp` es *instancia + ambiente* y la
base de datos es la que manda, no el nombre. Hoy hay 12 nombres de instancias viejas que existen a la vez en producción y en
prueba (por ejemplo `dnnya`, `repsic182`, `sidemo`). Para esas el endpoint no adivina y responde 409 con la lista de ambientes;
ahí sí hay que agregar el ambiente al final, con la tilde codificada (`producción` es `producci%C3%B3n`, `capacitación` es
`capacitaci%C3%B3n`):

```sh
curl -fsS -H "x-token: $(cat /opt/insts/.token)" "https://<dominio>/instrumentacion/config/dnnya/producci%C3%B3n" -o ...
```

La alternativa sería renombrar esas instancias con el prefijo `pr`, pero eso cambia los archivos y symlinks de `/opt/insts`.

## Desarrollo local

El `local-config.yaml` local (ignorado por git) puede tener cualquier valor, por ejemplo `token-local-de-prueba`:

```sh
curl -H "x-token: token-local-de-prueba" http://localhost:3042/instrumentacion/config/<instancia>
```

Sin la clave `instrumentacion.config-token` en la configuración, el endpoint responde 404.

## Dónde está en el código

- Endpoint: `addUnloggedServices` en `src/server/app-instrumentacion.ts` (ruta `/config/:instancia{/:ambiente}`).
- Armado del yaml: `datosConfig`, `armarYamlConfig` y `yamlDeInstancia` en `src/server/registrar-instancia.ts`.
- Tipo de la clave del token: `AppConfig` en `src/server/types-instrumentacion.ts`.
