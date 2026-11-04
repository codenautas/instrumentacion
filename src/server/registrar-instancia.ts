"use strict";

import { ProcedureContext } from "backend-plus";

type ClienteDb = ProcedureContext['client'];

const PUERTO_APP_INICIAL = 3001;
const PUERTO_DB_POR_DEFECTO = 5432;

export type ParametrosRegistro = {
    instancia: string
    ambiente: string
    servidor: string
    operativo: string
    nombre_operativo?: string | null
    descripcion_operativo?: string | null
    annio_operativo?: number | null
    onda_operativo?: string | null
    repositorio?: string | null
    uso?: string | null
    base_url?: string | null
    puerto?: number | null
    policy?: string | null
    success_redirect?: string | null
    database?: string | null
    db_servidor?: string | null
    db_port?: number | null
    db_owner?: string | null
    db_user?: string | null
    criticidad?: string | null
    tolerancia_downtime?: string | null
    so_user?: string | null
    db_schema?: string | null       // los db_* siguientes sólo se usan si la base se crea
    db_periodo?: string | null
    db_area?: string | null
    db_estado?: string | null
    db_en_campo?: boolean | null
    db_seg_confidencialidad?: number | null
    db_seg_integridad?: number | null
    db_seg_disponibilidad?: number | null
}

export type ResultadoRegistro = {
    instancia: string
    ambiente: string
    servidor: string
    puerto: number
    uso: string | null
    repositorio: string | null
    base_url: string
    policy: string | null
    success_redirect: string | null
    operativo: string
    operativoCreado: boolean
    nombre_operativo: string | null     // los de operativo sólo si se creó
    descripcion_operativo: string | null
    annio_operativo: number | null
    onda_operativo: string | null
    database: string
    db_servidor: string
    db_port: number
    databaseCreada: boolean
    criticidad: string | null
    tolerancia_downtime: string | null
    so_user: string | null
    db_owner: string | null             // los db_* siguientes, sólo si se creó la base (si existía no se toca)
    db_user: string | null
    db_schema: string | null
    db_periodo: string | null
    db_area: string | null
    db_estado: string | null
    db_en_campo: boolean | null
    db_seg_confidencialidad: number | null
    db_seg_integridad: number | null
    db_seg_disponibilidad: number | null
}

function numero(valor: unknown): number | null {
    return valor == null ? null : Number(valor);
}

function texto(valor: unknown): string | null {
    return valor == null ? null : String(valor);
}

function vacioANull(valor: string | null | undefined): string | null {
    return valor == null || valor.trim() === '' ? null : valor.trim();
}

// El puerto de la app es el máximo usado por las instancias del servidor más uno,
// salteando los que ya usa alguna base de datos de ese servidor.
export function calcularProximoPuerto(puertosApp: number[], puertosDb: number[]): number {
    var ocupados = new Set(puertosApp.concat(puertosDb));
    var puerto = puertosApp.length ? Math.max(...puertosApp) + 1 : PUERTO_APP_INICIAL;
    while (ocupados.has(puerto)) puerto++;
    return puerto;
}

export async function proximoPuertoApp(client: ClienteDb, servidor: string): Promise<number> {
    var puertosApp = (await client.query(`
      select puerto
        from instapp
        where servidor = $1 and puerto is not null
      `, [servidor]).fetchAll()).rows.map(row => Number(row.puerto));
    var puertosDb = (await client.query(`
      select port
        from databases
        where servidor = $1
      `, [servidor]).fetchAll()).rows.map(row => Number(row.port));
    return calcularProximoPuerto(puertosApp, puertosDb);
}

// Puerto de postgres más usado por las bases del servidor (o el estándar si no tiene bases).
export async function puertoDbHabitual(client: ClienteDb, servidor: string): Promise<number> {
    var row = (await client.query(`
      select port
        from databases
        where servidor = $1
        group by port
        order by count(*) desc, port
        limit 1
      `, [servidor]).fetchOneRowIfExists()).row;
    return row ? Number(row.port) : PUERTO_DB_POR_DEFECTO;
}

export async function registrarInstancia(client: ClienteDb, p: ParametrosRegistro): Promise<ResultadoRegistro> {
    var instancia = vacioANull(p.instancia);
    var ambiente = vacioANull(p.ambiente);
    var servidor = vacioANull(p.servidor);
    var operativo = vacioANull(p.operativo);
    if (!instancia || !ambiente || !servidor || !operativo) {
        throw new Error('Faltan datos: instancia, ambiente, servidor y operativo son obligatorios');
    }
    var existente = await client.query(`
      select 1
        from instapp
        where instancia = $1 and ambiente = $2
      `, [instancia, ambiente]).fetchOneRowIfExists();
    if (existente.row) {
        throw new Error(`La instancia ${instancia} ya existe en el ambiente ${ambiente}`);
    }
    var database = vacioANull(p.database) ?? instancia;
    var dbServidor = vacioANull(p.db_servidor) ?? servidor;
    var dbPort = p.db_port ?? await puertoDbHabitual(client, dbServidor);
    var puerto = p.puerto ?? await proximoPuertoApp(client, servidor);
    if ((await client.query(`
      select 1
        from instapp
        where servidor = $1 and puerto = $2
      `, [servidor, puerto]).fetchOneRowIfExists()).row) {
        throw new Error(`El puerto ${puerto} ya lo usa otra instancia en ${servidor}`);
    }
    // Lo que no se indica se propone: mismo repositorio que la última instancia del operativo,
    // base_url = /instancia y owner/usuario de la base según la convención <database>_owner / <database>_admin.
    var previa = (await client.query(`
      select repositorio
        from instapp
        where operativo = $1 and repositorio is not null
        order by fecha_instalacion desc
        limit 1
      `, [operativo]).fetchOneRowIfExists()).row;
    var repositorio = vacioANull(p.repositorio) ?? texto(previa?.repositorio);
    var baseUrl = vacioANull(p.base_url) ?? `/${instancia}`;
    var nombreOperativo = vacioANull(p.nombre_operativo);
    var descripcionOperativo = vacioANull(p.descripcion_operativo);
    var ondaOperativo = vacioANull(p.onda_operativo);
    var operativoCreado = !(await client.query(`
      select 1
        from operativos
        where operativo = $1
      `, [operativo]).fetchOneRowIfExists()).row;
    if (operativoCreado) {
        await client.query(`
          insert into operativos (operativo, nombre, descripcion, annio, onda)
            values ($1, $2, $3, $4, $5)
          `, [operativo, nombreOperativo, descripcionOperativo, p.annio_operativo ?? null, ondaOperativo]).execute();
    }
    var databaseCreada = !(await client.query(`
      select 1
        from databases
        where database = $1 and servidor = $2 and port = $3
      `, [database, dbServidor, dbPort]).fetchOneRowIfExists()).row;
    var baseDb = database.replace(/_db$/, '');
    var dbOwner = vacioANull(p.db_owner) ?? `${baseDb}_owner`;
    var dbUser = vacioANull(p.db_user) ?? `${baseDb}_admin`;
    if (databaseCreada) {
        await client.query(`
          insert into databases (database, servidor, port, owner, "user", schema, periodo, area, estado, en_campo, seg_confidencialidad, seg_integridad, seg_disponibilidad)
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [database, dbServidor, dbPort, dbOwner, dbUser, vacioANull(p.db_schema), vacioANull(p.db_periodo), vacioANull(p.db_area), vacioANull(p.db_estado),
            p.db_en_campo ?? null, p.db_seg_confidencialidad ?? null, p.db_seg_integridad ?? null, p.db_seg_disponibilidad ?? null]).execute();
    }
    await client.query(`
      insert into instapp (instancia, ambiente, uso, base_url, policy, success_redirect, repositorio, operativo, servidor, puerto, db_servidor, database, db_port,
          criticidad, tolerancia_downtime, so_user)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [instancia, ambiente, vacioANull(p.uso), baseUrl, vacioANull(p.policy), vacioANull(p.success_redirect), repositorio, operativo, servidor, puerto, dbServidor, database, dbPort,
        vacioANull(p.criticidad), vacioANull(p.tolerancia_downtime), vacioANull(p.so_user)]).execute();
    return {
        instancia, ambiente, servidor, puerto, uso: vacioANull(p.uso), repositorio, base_url: baseUrl,
        policy: vacioANull(p.policy), success_redirect: vacioANull(p.success_redirect),
        operativo, operativoCreado,
        nombre_operativo: operativoCreado ? nombreOperativo : null,
        descripcion_operativo: operativoCreado ? descripcionOperativo : null,
        annio_operativo: operativoCreado ? p.annio_operativo ?? null : null,
        onda_operativo: operativoCreado ? ondaOperativo : null,
        database, db_servidor: dbServidor, db_port: dbPort, databaseCreada,
        criticidad: vacioANull(p.criticidad), tolerancia_downtime: vacioANull(p.tolerancia_downtime), so_user: vacioANull(p.so_user),
        db_owner: databaseCreada ? dbOwner : null,
        db_user: databaseCreada ? dbUser : null,
        db_schema: databaseCreada ? vacioANull(p.db_schema) : null,
        db_periodo: databaseCreada ? vacioANull(p.db_periodo) : null,
        db_area: databaseCreada ? vacioANull(p.db_area) : null,
        db_estado: databaseCreada ? vacioANull(p.db_estado) : null,
        db_en_campo: databaseCreada ? p.db_en_campo ?? null : null,
        db_seg_confidencialidad: databaseCreada ? p.db_seg_confidencialidad ?? null : null,
        db_seg_integridad: databaseCreada ? p.db_seg_integridad ?? null : null,
        db_seg_disponibilidad: databaseCreada ? p.db_seg_disponibilidad ?? null : null,
    };
}

export type DatosConfig = {
    instancia: string
    ambiente: string
    puerto: number | null
    base_url: string | null
    policy: string | null
    success_redirect: string | null
    so_user: string | null
    version: string | null
    git_host: string | null
    git_group: string | null
    git_project: string | null
    db_host: string | null
    db_port: number | null
    database: string | null
    db_user: string | null
    db_schema: string | null
    db_owner: string | null
}

export async function datosConfig(client: ClienteDb, instancia: string, ambiente: string | null): Promise<DatosConfig[]> {
    return (await client.query(`
      select i.instancia, i.ambiente, i.puerto, i.base_url, i.policy, i.success_redirect, i.so_user, i.version,
          r.git_host, r.git_group, r.git_project,
          coalesce(ds.ip, ds.hostname, i.db_servidor) as db_host,
          i.db_port, i.database, d."user" as db_user, d.schema as db_schema, d.owner as db_owner
        from instapp i
          left join repositorios r on r.repositorio = i.repositorio
          left join databases d on d.database = i.database and d.servidor = i.db_servidor and d.port = i.db_port
          left join servidores ds on ds.servidor = i.db_servidor
        where i.instancia = $1 and ($2::text is null or i.ambiente = $2)
        order by i.ambiente
      `, [instancia, ambiente]).fetchAll()).rows.map(row => ({
        instancia: String(row.instancia),
        ambiente: String(row.ambiente),
        puerto: numero(row.puerto),
        base_url: texto(row.base_url),
        policy: texto(row.policy),
        success_redirect: texto(row.success_redirect),
        so_user: texto(row.so_user),
        version: texto(row.version),
        git_host: texto(row.git_host),
        git_group: texto(row.git_group),
        git_project: texto(row.git_project),
        db_host: texto(row.db_host),
        db_port: numero(row.db_port),
        database: texto(row.database),
        db_user: texto(row.db_user),
        db_schema: texto(row.db_schema),
        db_owner: texto(row.db_owner),
    }));
}

type NodoYaml = string | number | null | { [clave: string]: NodoYaml };

function escalarYaml(valor: string | number): string {
    return typeof valor === 'number' || /^[\w./:-]+$/.test(valor) ? String(valor) : JSON.stringify(valor);
}

// Omite los null y las secciones que quedan vacías; el texto vacío se escribe ("").
function lineasYaml(nodo: { [clave: string]: NodoYaml }, sangria: string = ''): string[] {
    return Object.entries(nodo).flatMap(([clave, valor]): string[] => {
        if (valor == null) return [];
        if (typeof valor === 'object') {
            var hijas = lineasYaml(valor, sangria + '  ');
            return hijas.length ? [`${sangria}${clave}:`, ...hijas] : [];
        }
        return [`${sangria}${clave}: ${escalarYaml(valor)}`];
    });
}

function sinBarras(valor: string | null): string | null {
    var limpio = valor?.replace(/^\/+|\/+$/g, '').trim();
    return limpio ? limpio : null;
}

const AMBIENTE_PRODUCCION = 'producción';

// El password no se guarda en esta base: hay que agregarlo a mano en el servidor.
// install.table-data-dir tampoco se deduce: se deja sugerido como comentario.
export function armarYamlConfig(d: DatosConfig): string {
    var lineas = lineasYaml({
        coderun: { version: d.version },
        server: { port: d.puerto, policy: d.policy, 'base-url': d.base_url, user: d.so_user ?? d.instancia },
        git: { project: sinBarras(d.git_project), group: sinBarras(d.git_group), host: sinBarras(d.git_host) },
        db: { host: d.db_host, port: d.db_port, database: d.database, user: d.db_user, schema: d.db_schema },
        install: { dump: { db: { owner: d.db_owner } } },
        login: { plus: { successRedirect: d.success_redirect } },
        'client-setup': { 'background-img': d.ambiente === AMBIENTE_PRODUCCION ? '' : null },
    });
    return [
        `# generado por instrumentacion para ${d.instancia} (${d.ambiente})`,
        ...lineas,
        '# db.password: agregar a mano',
        ...(d.policy ? [] : [`# install.table-data-dir: agregar a mano si corresponde, p.ej. ../dmencu-data/${d.instancia}/`]),
        ''
    ].join('\n');
}


// ---------- datos para la pantalla de alta (ws-registrar-instancia) ----------

// Datos que se copian de la última instancia / base del operativo (por ambiente) para sugerirlos en un alta nueva.
export type PlantillaInstancia = {
    criticidad: string | null
    tolerancia_downtime: string | null
    so_user: string | null          // sólo si es distinto del nombre de la instancia
}
export type PlantillaBase = {
    database: string
    owner: string | null
    user: string | null
    schema: string | null
    periodo: string | null
    area: string | null
    estado: string | null
    seg_confidencialidad: number | null
    seg_integridad: number | null
    seg_disponibilidad: number | null
}
export type OperativoOpcion = {
    operativo: string
    nombre: string | null
    descripcion: string | null
    annio: number | null
    onda: string | null
    repositorio: string | null
    usoNormal: string | null
    usoDm: string | null
    servidorPorAmbiente: Record<string, string>
    plantillasInstancia: Record<string, Partial<Record<'normal' | 'dm', PlantillaInstancia>>>  // por ambiente
    plantillasBase: Record<string, PlantillaBase>                                              // por ambiente
}
export type ServidorOpcion = {
    servidor: string
    host: string | null
    puertosUsados: number[]
    proximoPuerto: number
    dbFrecuente: string | null
}
export type ServidorDbOpcion = {
    id: string
    servidor: string
    port: number
    host: string | null
    producto: string | null
    version: string | null
    bases: number
}
export type RepositorioOpcion = {
    repositorio: string
    git_host: string | null
    git_group: string | null
    git_project: string | null
}
export type OpcionesRegistro = {
    ambientes: string[]
    usos: string[]
    repositorios: RepositorioOpcion[]
    areas: string[]
    operativos: OperativoOpcion[]
    instancias: { instancia: string, ambiente: string }[]
    databases: string[]
    servidores: ServidorOpcion[]
    serviciosDb: ServidorDbOpcion[]
}

async function filas(client: ClienteDb, sql: string): Promise<Record<string, unknown>[]> {
    return (await client.query(sql, []).fetchAll()).rows;
}

export async function opcionesRegistro(client: ClienteDb): Promise<OpcionesRegistro> {
    var ambientes = (await filas(client, `
      select ambiente
        from ambientes
        order by orden
      `)).map(row => String(row.ambiente));
    var usos = (await filas(client, `
      select uso
        from uso
        order by orden, uso
      `)).map(row => String(row.uso));
    var repositorios: RepositorioOpcion[] = (await filas(client, `
      select repositorio, git_host, git_group, git_project
        from repositorios
        order by repositorio
      `)).map(row => ({
        repositorio: String(row.repositorio),
        git_host: texto(row.git_host),
        git_group: texto(row.git_group),
        git_project: texto(row.git_project),
    }));
    var areas = (await filas(client, `
      select area
        from areas
        order by area
      `)).map(row => String(row.area));
    var instanciasRecientes = await filas(client, `
      select distinct on (operativo, ambiente, es_dm) operativo, ambiente, es_dm, criticidad, tolerancia_downtime, so_user, instancia
        from (
          select operativo, ambiente, coalesce(policy = 'web', false) or instancia ~ '^(pr|capa)?dm' as es_dm,
              criticidad, tolerancia_downtime, so_user, instancia, fecha_instalacion
            from instapp
            where operativo is not null
        ) x
        order by operativo, ambiente, es_dm, fecha_instalacion desc nulls last
      `);
    var basesRecientes = await filas(client, `
      select distinct on (i.operativo, i.ambiente) i.operativo, i.ambiente, d.database, d.owner, d."user", d.schema, d.periodo, d.area, d.estado,
          d.seg_confidencialidad, d.seg_integridad, d.seg_disponibilidad
        from instapp i
          inner join databases d on d.servidor = i.db_servidor and d.database = i.database and d.port = i.db_port
        where i.operativo is not null
        order by i.operativo, i.ambiente, i.fecha_instalacion desc nulls last
      `);
    var recientesPorAmbiente = await filas(client, `
      select distinct on (operativo, ambiente) operativo, ambiente, servidor
        from instapp
        where operativo is not null
        order by operativo, ambiente, fecha_instalacion desc nulls last
      `);
    var recientes = await filas(client, `
      select distinct on (operativo) operativo, repositorio
        from instapp
        where operativo is not null
        order by operativo, fecha_instalacion desc nulls last
      `);
    // el uso depende del tipo: las instancias dm (policy web o nombre dm.../prdm.../capadm...) usan otro que las comunes
    var usosPorTipo = await filas(client, `
      select distinct on (operativo, es_dm) operativo, es_dm, uso
        from (
          select operativo, coalesce(policy = 'web', false) or instancia ~ '^(pr|capa)?dm' as es_dm, uso, fecha_instalacion
            from instapp
            where operativo is not null and uso is not null
        ) x
        order by operativo, es_dm, fecha_instalacion desc nulls last
      `);
    var operativos: OperativoOpcion[] = (await filas(client, `
      select operativo, nombre, descripcion, annio, onda
        from operativos
        order by operativo
      `)).map(row => {
        var operativo = String(row.operativo);
        var reciente = recientes.find(r => r.operativo === operativo);
        var servidorPorAmbiente: Record<string, string> = {};
        recientesPorAmbiente.filter(r => r.operativo === operativo).forEach(r => { servidorPorAmbiente[String(r.ambiente)] = String(r.servidor); });
        var plantillasInstancia: OperativoOpcion['plantillasInstancia'] = {};
        instanciasRecientes.filter(r => r.operativo === operativo).forEach(r => {
            var ambiente = String(r.ambiente);
            var plantillas = plantillasInstancia[ambiente] ?? (plantillasInstancia[ambiente] = {});
            var soUser = texto(r.so_user);
            plantillas[r.es_dm === true ? 'dm' : 'normal'] = {
                criticidad: texto(r.criticidad),
                tolerancia_downtime: texto(r.tolerancia_downtime),
                so_user: soUser !== null && soUser !== String(r.instancia) ? soUser : null,
            };
        });
        var plantillasBase: OperativoOpcion['plantillasBase'] = {};
        basesRecientes.filter(r => r.operativo === operativo).forEach(r => {
            plantillasBase[String(r.ambiente)] = {
                database: String(r.database), owner: texto(r.owner), user: texto(r.user), schema: texto(r.schema), periodo: texto(r.periodo),
                area: texto(r.area), estado: texto(r.estado), seg_confidencialidad: numero(r.seg_confidencialidad),
                seg_integridad: numero(r.seg_integridad), seg_disponibilidad: numero(r.seg_disponibilidad),
            };
        });
        return {
            operativo,
            nombre: texto(row.nombre),
            descripcion: texto(row.descripcion),
            annio: numero(row.annio),
            onda: texto(row.onda),
            repositorio: texto(reciente?.repositorio),
            usoNormal: texto(usosPorTipo.find(u => u.operativo === operativo && u.es_dm === false)?.uso),
            usoDm: texto(usosPorTipo.find(u => u.operativo === operativo && u.es_dm === true)?.uso),
            servidorPorAmbiente, plantillasInstancia, plantillasBase
        };
    });
    var instancias = (await filas(client, `
      select instancia, ambiente
        from instapp
      `)).map(row => ({ instancia: String(row.instancia), ambiente: String(row.ambiente) }));
    var databases = (await filas(client, `
      select servidor, port, database
        from databases
      `)).map(row => `${row.servidor}:${row.port}/${row.database}`);
    var puertosApp = await filas(client, `
      select servidor, puerto
        from instapp
        where puerto is not null
      `);
    var basesPorServicio = await filas(client, `
      select servidor, port, count(*) as bases
        from databases
        group by servidor, port
      `);
    var motores = await filas(client, `
      select sv.servidor, sv.puerto::integer as port, sv.producto, sv.version
        from servidores_versiones sv
          inner join productos p on p.producto = sv.producto
        where p.tipo = 'DBMS' and sv.puerto ~ '^[0-9]+$'
      `);
    var hosts = await filas(client, `
      select servidor, coalesce(ip, hostname) as host
        from servidores
      `);
    var frecuentes = await filas(client, `
      select servidor, db_servidor, db_port, count(*) as cantidad
        from instapp
        where db_servidor is not null and db_port is not null
        group by servidor, db_servidor, db_port
        order by cantidad desc, db_servidor, db_port
      `);
    var serviciosDb = new Map<string, ServidorDbOpcion>();
    var servicio = (servidor: string, port: number): ServidorDbOpcion => {
        var id = `${servidor}:${port}`;
        var existente = serviciosDb.get(id);
        if (existente) return existente;
        var nuevo: ServidorDbOpcion = {
            id, servidor, port, producto: null, version: null, bases: 0,
            host: texto(hosts.find(h => h.servidor === servidor)?.host)
        };
        serviciosDb.set(id, nuevo);
        return nuevo;
    };
    motores.forEach(row => {
        var s = servicio(String(row.servidor), Number(row.port));
        s.producto = texto(row.producto);
        s.version = texto(row.version);
    });
    basesPorServicio.forEach(row => { servicio(String(row.servidor), Number(row.port)).bases = Number(row.bases); });
    var servidores: ServidorOpcion[] = (await filas(client, `
      select servidor
        from servidores
        where eliminado is not true
        order by servidor
      `)).map(row => {
        var servidor = String(row.servidor);
        var usados = puertosApp.filter(r => r.servidor === servidor).map(r => Number(r.puerto));
        var dbPorts = Array.from(serviciosDb.values()).filter(s => s.servidor === servidor).map(s => s.port);
        var frecuente = frecuentes.find(r => r.servidor === servidor);
        return {
            servidor,
            host: texto(hosts.find(h => h.servidor === servidor)?.host),
            puertosUsados: usados,
            proximoPuerto: calcularProximoPuerto(usados, dbPorts),
            dbFrecuente: frecuente ? `${frecuente.db_servidor}:${frecuente.db_port}` : null
        };
    });
    return {
        ambientes, usos, repositorios, areas, operativos, instancias, databases, servidores,
        serviciosDb: Array.from(serviciosDb.values()).sort((a, b) => a.id.localeCompare(b.id))
    };
}

// El yaml de una instancia registrada (el mismo que devuelve /config, pero con error claro si no existe o es ambigua).
export async function yamlDeInstancia(client: ClienteDb, instancia: string, ambiente: string | null): Promise<string> {
    var datos = await datosConfig(client, instancia, ambiente);
    if (datos.length === 0) throw new Error(`No existe la instancia ${instancia}${ambiente ? ' en ' + ambiente : ''}`);
    if (datos.length > 1) throw new Error(`La instancia ${instancia} está en varios ambientes: ${datos.map(d => d.ambiente).join(', ')}`);
    return armarYamlConfig(datos[0]);
}

// Arma el yaml como saldría de /config si la instancia ya estuviera registrada (para mostrarlo antes de registrar).
export async function previsualizarYaml(client: ClienteDb, p: ParametrosRegistro): Promise<string> {
    var repo = p.repositorio ? (await client.query(`
      select git_host, git_group, git_project
        from repositorios
        where repositorio = $1
      `, [p.repositorio]).fetchOneRowIfExists()).row : undefined;
    var dbServidor = vacioANull(p.db_servidor) ?? p.servidor;
    var host = (await client.query(`
      select coalesce(ip, hostname, servidor) as host
        from servidores
        where servidor = $1
      `, [dbServidor]).fetchOneRowIfExists()).row;
    var base = (await client.query(`
      select owner, "user", schema
        from databases
        where database = $1 and servidor = $2 and port = $3
      `, [p.database, dbServidor, p.db_port]).fetchOneRowIfExists()).row;
    return armarYamlConfig({
        instancia: p.instancia,
        ambiente: p.ambiente,
        puerto: p.puerto ?? null,
        base_url: vacioANull(p.base_url),
        policy: vacioANull(p.policy),
        success_redirect: vacioANull(p.success_redirect),
        so_user: vacioANull(p.so_user),
        version: null,
        git_host: texto(repo?.git_host),
        git_group: texto(repo?.git_group),
        git_project: texto(repo?.git_project),
        db_host: texto(host?.host) ?? dbServidor,
        db_port: p.db_port ?? null,
        database: vacioANull(p.database),
        db_user: base ? texto(base.user) : vacioANull(p.db_user),
        db_schema: base ? texto(base.schema) : vacioANull(p.db_schema),
        db_owner: base ? texto(base.owner) : vacioANull(p.db_owner),
    });
}
