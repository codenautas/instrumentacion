"use strict";

// Pantalla "registrar instancia" (menuType 'instancia_registrar', ver getMenu en app-instrumentacion.ts).
// Los datos salen de los procedures instancia_registrar_opciones / instancia_registrar_yaml y el alta la hace instancia_registrar.
// Los tipos de abajo repiten los de src/server/registrar-instancia.ts (el cliente y el servidor se compilan por separado).

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ReactDOM from "react-dom";
import {
    Alert, Autocomplete, Box, Button, Chip, createFilterOptions, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, TextField,
    ToggleButton, ToggleButtonGroup, Typography
} from "@mui/material";

type PlantillaInstancia = {
    criticidad: string | null
    tolerancia_downtime: string | null
    so_user: string | null
}
type PlantillaBase = {
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
type OperativoOpcion = {
    operativo: string
    nombre: string | null
    descripcion: string | null
    annio: number | null
    onda: string | null
    repositorio: string | null
    usoNormal: string | null
    usoDm: string | null
    servidorPorAmbiente: Record<string, string>
    plantillasInstancia: Record<string, Partial<Record<'normal' | 'dm', PlantillaInstancia>>>
    plantillasBase: Record<string, PlantillaBase>
}
type ServidorOpcion = {
    servidor: string
    host: string | null
    puertosUsados: number[]
    proximoPuerto: number
    dbFrecuente: string | null
}
type ServidorDbOpcion = {
    id: string
    servidor: string
    port: number
    host: string | null
    producto: string | null
    version: string | null
    bases: number
}
type RepositorioOpcion = {
    repositorio: string
    git_host: string | null
    git_group: string | null
    git_project: string | null
}
type OpcionesRegistro = {
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
type ParametrosRegistro = {
    instancia: string
    ambiente: string
    servidor: string
    operativo: string
    nombre_operativo: string | null
    descripcion_operativo: string | null
    annio_operativo: number | null
    onda_operativo: string | null
    repositorio: string | null
    uso: string | null
    base_url: string | null
    puerto: number | null
    policy: string | null
    success_redirect: string | null
    database: string | null
    db_servidor: string | null
    db_port: number | null
    db_owner: string | null
    db_user: string | null
    criticidad: string | null
    tolerancia_downtime: string | null
    so_user: string | null
    db_schema: string | null
    db_periodo: string | null
    db_area: string | null
    db_estado: string | null
    db_en_campo: boolean | null
    db_seg_confidencialidad: number | null
    db_seg_integridad: number | null
    db_seg_disponibilidad: number | null
}

type ResultadoRegistro = {
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
    nombre_operativo: string | null
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
    db_owner: string | null
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

declare const myOwn: {
    wScreens: Record<string, () => void | Promise<void>>
    ajax: {
        instancia_registrar_opciones: (params: {}) => Promise<OpcionesRegistro>
        instancia_registrar_yaml: (params: Partial<ParametrosRegistro>) => Promise<string>
        instancia_registrar: (params: ParametrosRegistro) => Promise<ResultadoRegistro>
    }
}

// navigator.clipboard sólo existe en páginas seguras (https o localhost); si no está se copia con un textarea
async function copiarTexto(texto: string): Promise<boolean> {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(texto);
            return true;
        }
    } catch {
        // se sigue con el plan B
    }
    var area = document.createElement('textarea');
    area.value = texto;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var copiado = false;
    try {
        copiado = document.execCommand('copy');
    } catch {
        copiado = false;
    }
    document.body.removeChild(area);
    return copiado;
}

type Tipo = 'normal' | 'dm';
type Campo = 'instancia' | 'repositorio' | 'uso' | 'puerto' | 'base_url' | 'database' | 'db_owner' | 'db_user' | 'policy' | 'success_redirect'
    | 'criticidad' | 'tolerancia_downtime' | 'so_user'
    | 'db_schema' | 'db_periodo' | 'db_area' | 'db_estado' | 'db_en_campo' | 'db_seg_c' | 'db_seg_i' | 'db_seg_d';
type Valores = Record<Campo, string>;

type DatosOperativo = { nombre: string, descripcion: string, annio: string, onda: string };

type Estado = {
    operativo: string
    baseOperativo: string | null // operativo del que se copian los datos si es nuevo (null: el más parecido, automático)
    datosOperativo: Partial<DatosOperativo> // lo que se editó a mano del operativo nuevo
    ambiente: string
    tipo: Tipo
    servidor: string | null // sólo si lo eligió a mano
    dbSrv: string | null    // sólo si lo eligió a mano
    manual: Partial<Valores>
}

const PREFIJO_AMBIENTE: Record<string, string> = { 'prueba': 'pr', 'capacitación': 'capa' };
const SUFIJO_DB_AMBIENTE: Record<string, string> = { 'prueba': '_muleto_db', 'capacitación': '_capa_db' };
const USO_DM = 'sistema de gestion y DM';
const USO_COMUN = 'sistema de gestión';
const ESTADO_AMBIENTE: Record<string, string> = { 'producción': 'producción', 'prueba': 'testeo', 'capacitación': 'capacitacion' };
const ESTADOS_BASE = ['producción', 'testeo', 'capacitacion', 'desarrollo', 'preprod'];
const CRITICIDADES = ['baja', 'media', 'alta'];

type Derivados = {
    v: Valores
    sugerido: Valores
    servidor: string
    servidorSugerido: string
    srv: ServidorOpcion | null
    dbSrv: string
    dbSrvSugerido: string
    servicioDb: ServidorDbOpcion | null
    operativo: OperativoOpcion | null
    operativoNuevo: boolean
    anterior: OperativoOpcion | null
    datosOperativo: DatosOperativo
    datosOperativoSugeridos: DatosOperativo
    instanciaExiste: boolean
    dbExiste: boolean
    puertoOcupado: boolean
}

// El operativo anterior es el más parecido: mismo prefijo (etoi264 -> etoi263) o un prefijo que empieza igual
// (etoipc271 -> etoi264); entre los parecidos, el de mayor número. Mientras más largo el prefijo común, mejor.
function operativoAnterior(op: OpcionesRegistro, nuevo: string): OperativoOpcion | null {
    var partes = /^(.*?)(\d+)$/.exec(nuevo);
    if (!partes) return null;
    var prefijo = partes[1].toLowerCase();
    var mejor: { o: OperativoOpcion, puntos: number, numero: number } | null = null;
    op.operativos.forEach(o => {
        var p = /^(.*?)(\d+)$/.exec(o.operativo);
        if (!p || o.operativo === nuevo) return;
        var otro = p[1].toLowerCase();
        var comun = Math.min(prefijo.length, otro.length);
        var puntos = otro === prefijo ? 1000 + comun
            : comun >= 3 && (prefijo.indexOf(otro) === 0 || otro.indexOf(prefijo) === 0) ? comun
            : 0;
        if (!puntos) return;
        var numero = Number(p[2]);
        if (!mejor || puntos > mejor.puntos || (puntos === mejor.puntos && numero > mejor.numero)) mejor = { o, puntos, numero };
    });
    return mejor ? (mejor as { o: OperativoOpcion }).o : null;
}

// El código del operativo suele llevar el año y la onda al final: etoi264 -> 2026 onda 4, esede241 -> 2024 onda 1, ggs2026 -> 2026.
function deducirAnnioOnda(operativo: string): { annio: string, onda: string } | null {
    var completo = /(?:^|\D)((?:19|20)\d\d)$/.exec(operativo);
    if (completo) return { annio: completo[1], onda: '' };
    var corto = /(?:^|\D)(\d\d)(\d)$/.exec(operativo);
    if (corto) return { annio: String(2000 + Number(corto[1])), onda: corto[2] };
    return null;
}

// El período de la base copia el formato de la anterior cambiando el año y la onda ("2026 Trim 4" -> "2027 Trim 1").
function periodoSugerido(plantilla: string | null | undefined, origen: OperativoOpcion | null, annio: string, onda: string): string {
    if (!plantilla) return annio + (annio && onda ? ' ' + onda : '');
    var p = plantilla;
    if (origen?.annio != null && annio) p = p.split(String(origen.annio)).join(annio);
    if (origen?.onda && onda && p.endsWith(origen.onda)) p = p.slice(0, p.length - origen.onda.length) + onda;
    return p;
}

function derivar(op: OpcionesRegistro, st: Estado): Derivados {
    var operativo = op.operativos.find(o => o.operativo === st.operativo) ?? null;
    var operativoNuevo = !!st.operativo && !operativo;
    var anteriorParecido = (st.baseOperativo ? op.operativos.find(o => o.operativo === st.baseOperativo) : null) ?? operativoAnterior(op, st.operativo);
    var anterior = operativoNuevo ? anteriorParecido : null;
    var base = operativo ?? anterior;
    var deducido = operativoNuevo ? deducirAnnioOnda(st.operativo) : null;
    // si el nombre del anterior termina con su onda (ej. "... 4"), se cambia por la onda deducida
    var nombreBase = base?.nombre ?? '';
    if (deducido && deducido.onda && anterior?.onda && nombreBase.endsWith(anterior.onda)) {
        nombreBase = nombreBase.slice(0, nombreBase.length - anterior.onda.length) + deducido.onda;
    }
    var datosOperativoSugeridos: DatosOperativo = {
        nombre: nombreBase,
        descripcion: base?.descripcion ?? '',
        annio: deducido ? deducido.annio : (base?.annio == null ? '' : String(base.annio)),
        onda: deducido ? deducido.onda : (base?.onda ?? ''),
    };
    var datosOperativo: DatosOperativo = operativo ? datosOperativoSugeridos : {
        nombre: st.datosOperativo.nombre ?? datosOperativoSugeridos.nombre,
        descripcion: st.datosOperativo.descripcion ?? datosOperativoSugeridos.descripcion,
        annio: st.datosOperativo.annio ?? datosOperativoSugeridos.annio,
        onda: st.datosOperativo.onda ?? datosOperativoSugeridos.onda,
    };
    var servidorSugerido = operativo ? (operativo.servidorPorAmbiente[st.ambiente] ?? operativo.servidorPorAmbiente['producción'] ?? '') : '';
    var servidor = st.servidor ?? servidorSugerido;
    var srv = op.servidores.find(s => s.servidor === servidor) ?? null;
    var dbSrvSugerido = srv?.dbFrecuente ?? '';
    var dbSrv = st.dbSrv ?? dbSrvSugerido;
    var elegir = (campo: Campo, sugerencia: string): string => st.manual[campo] ?? sugerencia;
    var prefijo = (PREFIJO_AMBIENTE[st.ambiente] ?? '') + (st.tipo == 'dm' ? 'dm' : '');
    var instanciaSug = st.operativo ? prefijo + st.operativo : '';
    var instancia = elegir('instancia', instanciaSug);
    var databaseSug = st.operativo ? st.operativo + (SUFIJO_DB_AMBIENTE[st.ambiente] ?? '_db') : '';
    var database = elegir('database', databaseSug);
    var baseDb = database.replace(/_db$/, '');
    // lo que no se indica se copia de la última instancia / base del mismo ambiente del operativo (o del anterior parecido)
    var origen = operativo ?? anteriorParecido;
    var plantillasInst = origen?.plantillasInstancia[st.ambiente];
    var plantillaInst = plantillasInst?.[st.tipo] ?? plantillasInst?.[st.tipo == 'dm' ? 'normal' : 'dm'] ?? null;
    var plantillasBase = origen?.plantillasBase ?? {};
    var plantillaBase: PlantillaBase | null = plantillasBase[st.ambiente] ?? null;
    var plantillaBaseAlguna: PlantillaBase | null = plantillaBase ?? Object.keys(plantillasBase).map(k => plantillasBase[k])[0] ?? null;
    // owner y usuario: los de la anterior si no siguen la convención <base>_owner / <base>_admin (ej. tedede_owner / tedede_php)
    var baseDePlantilla = plantillaBaseAlguna ? plantillaBaseAlguna.database.replace(/_db$/, '') : '';
    var ownerEspecial = plantillaBaseAlguna && plantillaBaseAlguna.owner && plantillaBaseAlguna.owner !== baseDePlantilla + '_owner' ? plantillaBaseAlguna.owner : null;
    var userEspecial = plantillaBaseAlguna && plantillaBaseAlguna.user && plantillaBaseAlguna.user !== baseDePlantilla + '_admin' ? plantillaBaseAlguna.user : null;
    var numeroComoTexto = (n: number | null | undefined): string => n == null ? '' : String(n);
    var sugerido: Valores = {
        instancia: instanciaSug,
        // lo que el operativo no tiene (por ejemplo si es nuevo) se toma del anterior parecido
        repositorio: operativo?.repositorio ?? anteriorParecido?.repositorio ?? '',
        uso: (st.tipo == 'dm' ? (operativo?.usoDm ?? anteriorParecido?.usoDm ?? USO_DM) : (operativo?.usoNormal ?? anteriorParecido?.usoNormal ?? USO_COMUN)),
        puerto: srv ? String(srv.proximoPuerto) : '',
        base_url: instancia ? '/' + instancia : '',
        database: databaseSug,
        db_owner: baseDb ? (ownerEspecial ?? baseDb + '_owner') : '',
        db_user: baseDb ? (userEspecial ?? baseDb + '_admin') : '',
        policy: st.tipo == 'dm' ? 'web' : '',
        success_redirect: st.tipo == 'dm' ? '/campo' : '',
        criticidad: plantillaInst?.criticidad ?? (st.ambiente == 'producción' ? 'alta' : 'baja'),
        tolerancia_downtime: plantillaInst?.tolerancia_downtime ?? '',
        // el usuario del SO es el de la instancia anterior si era distinto del nombre (ej. tedede_php); si no, el nombre de la instancia
        so_user: plantillaInst?.so_user ?? instancia,
        db_schema: plantillaBaseAlguna?.schema ?? '',
        db_periodo: periodoSugerido(plantillaBaseAlguna?.periodo, origen, datosOperativo.annio, datosOperativo.onda),
        db_area: plantillaBaseAlguna?.area ?? '',
        db_estado: plantillaBase?.estado ?? ESTADO_AMBIENTE[st.ambiente] ?? '',
        db_en_campo: '',
        db_seg_c: numeroComoTexto(plantillaBaseAlguna?.seg_confidencialidad),
        db_seg_i: numeroComoTexto(plantillaBaseAlguna?.seg_integridad),
        db_seg_d: numeroComoTexto(plantillaBaseAlguna?.seg_disponibilidad),
    };
    var v: Valores = {
        instancia,
        repositorio: elegir('repositorio', sugerido.repositorio),
        uso: elegir('uso', sugerido.uso),
        puerto: elegir('puerto', sugerido.puerto),
        base_url: elegir('base_url', sugerido.base_url),
        database,
        db_owner: elegir('db_owner', sugerido.db_owner),
        db_user: elegir('db_user', sugerido.db_user),
        policy: elegir('policy', sugerido.policy),
        success_redirect: elegir('success_redirect', sugerido.success_redirect),
        criticidad: elegir('criticidad', sugerido.criticidad),
        tolerancia_downtime: elegir('tolerancia_downtime', sugerido.tolerancia_downtime),
        so_user: elegir('so_user', sugerido.so_user),
        db_schema: elegir('db_schema', sugerido.db_schema),
        db_periodo: elegir('db_periodo', sugerido.db_periodo),
        db_area: elegir('db_area', sugerido.db_area),
        db_estado: elegir('db_estado', sugerido.db_estado),
        db_en_campo: elegir('db_en_campo', sugerido.db_en_campo),
        db_seg_c: elegir('db_seg_c', sugerido.db_seg_c),
        db_seg_i: elegir('db_seg_i', sugerido.db_seg_i),
        db_seg_d: elegir('db_seg_d', sugerido.db_seg_d),
    };
    return {
        v, sugerido, servidor, servidorSugerido, srv, dbSrv, dbSrvSugerido,
        servicioDb: op.serviciosDb.find(s => s.id === dbSrv) ?? null,
        operativo, operativoNuevo, anterior, datosOperativo, datosOperativoSugeridos,
        instanciaExiste: op.instancias.some(i => i.instancia === instancia && i.ambiente === st.ambiente),
        dbExiste: op.databases.indexOf(dbSrv + '/' + database) >= 0,
        puertoOcupado: !!srv && srv.puertosUsados.indexOf(Number(v.puerto)) >= 0,
    };
}

function problemas(st: Estado, d: Derivados): string[] {
    var p: string[] = [];
    if (!st.operativo) p.push('Falta el operativo.');
    if (!d.v.instancia) p.push('Falta el nombre de la instancia.');
    else if (d.instanciaExiste) p.push(`La instancia ${d.v.instancia} ya existe en ${st.ambiente}. Cambiá el ambiente, el tipo o el nombre.`);
    if (!d.servidor) p.push('Elegí el servidor de la app.');
    if (!d.v.puerto || isNaN(Number(d.v.puerto))) p.push('Falta el puerto de la app.');
    else if (d.puertoOcupado) p.push(`El puerto ${d.v.puerto} ya lo usa otra instancia en ${d.servidor}.`);
    if (!d.servicioDb) p.push('Elegí el servidor de la base.');
    if (!d.v.database) p.push('Falta el nombre de la base.');
    if (!d.dbExiste) {
        ['db_seg_c', 'db_seg_i', 'db_seg_d'].forEach(k => {
            var x = d.v[k as 'db_seg_c' | 'db_seg_i' | 'db_seg_d'].trim();
            if (x !== '' && isNaN(Number(x))) p.push('Las seguridades de la base (C, I, D) tienen que ser números.');
        });
    }
    if (d.operativoNuevo && !d.datosOperativo.nombre.trim()) p.push('Poné el nombre del operativo nuevo.');
    if (d.operativoNuevo && d.datosOperativo.annio.trim() !== '' && isNaN(Number(d.datosOperativo.annio))) p.push('El año del operativo tiene que ser un número.');
    return p;
}

function aParametros(st: Estado, d: Derivados): ParametrosRegistro {
    var vacio = (s: string): string | null => s.trim() === '' ? null : s.trim();
    var entero = (s: string): number | null => s.trim() === '' || isNaN(Number(s)) ? null : Number(s);
    return {
        instancia: d.v.instancia,
        ambiente: st.ambiente,
        servidor: d.servidor,
        operativo: st.operativo,
        nombre_operativo: d.operativoNuevo ? vacio(d.datosOperativo.nombre) : null,
        descripcion_operativo: d.operativoNuevo ? vacio(d.datosOperativo.descripcion) : null,
        annio_operativo: d.operativoNuevo && d.datosOperativo.annio.trim() !== '' ? Number(d.datosOperativo.annio) : null,
        onda_operativo: d.operativoNuevo ? vacio(d.datosOperativo.onda) : null,
        repositorio: vacio(d.v.repositorio),
        uso: vacio(d.v.uso),
        base_url: vacio(d.v.base_url),
        puerto: d.v.puerto === '' ? null : Number(d.v.puerto),
        policy: vacio(d.v.policy),
        success_redirect: vacio(d.v.success_redirect),
        database: vacio(d.v.database),
        db_servidor: d.servicioDb ? d.servicioDb.servidor : null,
        db_port: d.servicioDb ? d.servicioDb.port : null,
        db_owner: vacio(d.v.db_owner),
        db_user: vacio(d.v.db_user),
        criticidad: vacio(d.v.criticidad),
        tolerancia_downtime: vacio(d.v.tolerancia_downtime),
        so_user: vacio(d.v.so_user),
        db_schema: vacio(d.v.db_schema),
        db_periodo: vacio(d.v.db_periodo),
        db_area: vacio(d.v.db_area),
        db_estado: vacio(d.v.db_estado),
        db_en_campo: d.v.db_en_campo == 'sí' ? true : d.v.db_en_campo == 'no' ? false : null,
        db_seg_confidencialidad: entero(d.v.db_seg_c),
        db_seg_integridad: entero(d.v.db_seg_i),
        db_seg_disponibilidad: entero(d.v.db_seg_d),
    };
}

// host/grupo/proyecto de git sin barras sobrantes (en la base están como "https://github.com/", "/es-ba/", etc.)
function urlGit(r: RepositorioOpcion): string {
    var limpio = (s: string | null) => (s ?? '').replace(/^\/+|\/+$/g, '').trim();
    var partes = [limpio(r.git_host), limpio(r.git_group), limpio(r.git_project)].filter(p => p !== '');
    return partes.join('/');
}

function textoMotor(s: ServidorDbOpcion): string {
    return s.version ? `${s.producto ?? 'motor'} ${s.version}` : 'versión sin registrar';
}

// Qué se guarda en cada tabla, para mostrarlo antes de registrar y después de registrado.
type SeccionResumen = { tabla: string, accion: 'se crea' | 'ya existe, no se modifica', filas: [string, string][] };

function vacioComoGuion(x: string | number | null | undefined): string {
    return x === null || x === undefined || x === '' ? '—' : String(x);
}

function seccionesDeResultado(r: ResultadoRegistro): SeccionResumen[] {
    return [
        {
            tabla: 'operativos', accion: r.operativoCreado ? 'se crea' : 'ya existe, no se modifica',
            filas: r.operativoCreado ? [
                ['operativo', r.operativo], ['nombre', vacioComoGuion(r.nombre_operativo)], ['descripción', vacioComoGuion(r.descripcion_operativo)],
                ['año', vacioComoGuion(r.annio_operativo)], ['onda', vacioComoGuion(r.onda_operativo)],
            ] : [['operativo', r.operativo]]
        },
        {
            tabla: 'databases', accion: r.databaseCreada ? 'se crea' : 'ya existe, no se modifica',
            filas: r.databaseCreada ? [
                ['base', r.database], ['servidor:puerto', r.db_servidor + ':' + r.db_port], ['owner', vacioComoGuion(r.db_owner)], ['usuario', vacioComoGuion(r.db_user)],
                ['esquema', vacioComoGuion(r.db_schema)], ['período', vacioComoGuion(r.db_periodo)], ['área', vacioComoGuion(r.db_area)], ['estado', vacioComoGuion(r.db_estado)],
                ['en campo', r.db_en_campo === null ? '—' : r.db_en_campo ? 'sí' : 'no'],
                ['seguridad C / I / D', [r.db_seg_confidencialidad, r.db_seg_integridad, r.db_seg_disponibilidad].map(vacioComoGuion).join(' / ')],
            ] : [['base', r.database], ['servidor:puerto', r.db_servidor + ':' + r.db_port]]
        },
        {
            tabla: 'instapp', accion: 'se crea',
            filas: [
                ['instancia', r.instancia], ['ambiente', r.ambiente], ['operativo', r.operativo], ['uso', vacioComoGuion(r.uso)],
                ['repositorio', vacioComoGuion(r.repositorio)], ['servidor', r.servidor], ['puerto', String(r.puerto)], ['base_url', vacioComoGuion(r.base_url)],
                ['policy', vacioComoGuion(r.policy)], ['successRedirect', vacioComoGuion(r.success_redirect)],
                ['criticidad', vacioComoGuion(r.criticidad)], ['tolerancia downtime', vacioComoGuion(r.tolerancia_downtime)], ['usuario del SO', vacioComoGuion(r.so_user)],
                ['base de datos', r.database + ' en ' + r.db_servidor + ':' + r.db_port],
            ]
        },
    ];
}

function ResumenSecciones(props: { secciones: SeccionResumen[] }) {
    return <Stack spacing={1.5}>
        {props.secciones.map(s => <Box key={s.tabla}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{s.tabla}</Typography>
                <Chip size="small" variant="outlined" color={s.accion === 'se crea' ? 'success' : 'info'} label={s.accion} />
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'max-content minmax(0, 1fr)', columnGap: 2, rowGap: 0.25 }}>
                {s.filas.map(([k, v]) => <React.Fragment key={k}>
                    <Typography variant="body2" color="text.secondary">{k}</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{v}</Typography>
                </React.Fragment>)}
            </Box>
        </Box>)}
    </Stack>;
}

// Lo mismo que devolvería el servidor, calculado con lo que muestra el formulario (para el resumen previo).
function resultadoPrevio(st: Estado, d: Derivados): ResultadoRegistro {
    var p = aParametros(st, d);
    var vacio = (x: string | null): string | null => x === null || x.trim() === '' ? null : x;
    return {
        instancia: p.instancia, ambiente: p.ambiente, servidor: p.servidor, puerto: p.puerto ?? 0, uso: vacio(p.uso), repositorio: vacio(p.repositorio),
        base_url: p.base_url ?? '', policy: p.policy, success_redirect: p.success_redirect,
        operativo: p.operativo, operativoCreado: d.operativoNuevo, nombre_operativo: p.nombre_operativo, descripcion_operativo: p.descripcion_operativo,
        annio_operativo: p.annio_operativo, onda_operativo: p.onda_operativo,
        database: p.database ?? '', db_servidor: p.db_servidor ?? '', db_port: p.db_port ?? 0, databaseCreada: !d.dbExiste,
        criticidad: p.criticidad, tolerancia_downtime: p.tolerancia_downtime, so_user: p.so_user,
        db_owner: d.dbExiste ? null : (p.db_owner ?? (p.database ? p.database.replace(/_db$/, '') + '_owner' : null)),
        db_user: d.dbExiste ? null : (p.db_user ?? (p.database ? p.database.replace(/_db$/, '') + '_admin' : null)),
        db_schema: d.dbExiste ? null : p.db_schema, db_periodo: d.dbExiste ? null : p.db_periodo, db_area: d.dbExiste ? null : p.db_area,
        db_estado: d.dbExiste ? null : p.db_estado, db_en_campo: d.dbExiste ? null : p.db_en_campo,
        db_seg_confidencialidad: d.dbExiste ? null : p.db_seg_confidencialidad, db_seg_integridad: d.dbExiste ? null : p.db_seg_integridad,
        db_seg_disponibilidad: d.dbExiste ? null : p.db_seg_disponibilidad,
    };
}

type CampoTextoProps = {
    campo: Campo
    label: string
    st: Estado
    d: Derivados
    cambiarManual: (campo: Campo, valor: string | null) => void
    mono?: boolean
    lista?: string[]
    detalles?: Record<string, string> // contexto de cada opción de la lista (se muestra en la opción y debajo del campo)
    disabled?: boolean
}

function CampoTexto(props: CampoTextoProps) {
    var { campo, label, st, d, cambiarManual, mono, lista, detalles, disabled } = props;
    var editado = campo in st.manual;
    var valor = d.v[campo];
    var marca = editado
        ? <Button size="small" sx={{ minWidth: 0, p: '0 4px', textTransform: 'none', fontSize: 12 }}
            title={'volver a la sugerencia: ' + d.sugerido[campo]} onClick={() => cambiarManual(campo, null)}>editado ↺</Button>
        : <Typography variant="caption" color="text.secondary">auto</Typography>;
    var sx = mono ? { '& input': { fontFamily: 'monospace' } } : undefined;
    if (lista) {
        var detalle = detalles ? detalles[valor] : undefined;
        return <Autocomplete freeSolo size="small" options={lista} value={valor} disabled={disabled}
            filterOptions={createFilterOptions<string>({ stringify: o => o + ' ' + (detalles?.[o] ?? '') })}
            renderOption={(p, o) => <li {...p} key={o}><Box>
                <Typography>{o}</Typography>
                {detalles && <Typography variant="caption" color="text.secondary">{detalles[o] || 'sin datos de git'}</Typography>}
            </Box></li>}
            onInputChange={(_e, x) => { if (x !== valor) cambiarManual(campo, x); }}
            renderInput={p => <TextField {...p} label={label}
                helperText={detalles ? (valor ? (detalle ?? 'repositorio nuevo: no está en la tabla de repositorios') : ' ') : undefined}
                InputProps={{ ...p.InputProps, endAdornment: <React.Fragment>{marca}{p.InputProps.endAdornment}</React.Fragment> }} />} />;
    }
    return <TextField size="small" fullWidth label={label} value={valor} disabled={disabled} sx={sx}
        onChange={e => cambiarManual(campo, e.target.value)}
        InputProps={{ endAdornment: marca }} />;
}

var filtroServidores = createFilterOptions<ServidorOpcion>({ stringify: s => s.servidor + ' ' + (s.host ?? '') });
var filtroServiciosDb = createFilterOptions<ServidorDbOpcion>({ stringify: s => s.id + ' ' + (s.host ?? '') + ' ' + textoMotor(s) });

type OpcionOperativo = { id: string, nombre: string | null, nuevo: boolean };
var filtroOperativos = createFilterOptions<OpcionOperativo>({ stringify: o => o.id + ' ' + (o.nombre ?? '') });

type SelectorOperativoProps = { op: OpcionesRegistro, st: Estado, d: Derivados, set: (parche: Partial<Estado>) => void };

// Operativos existentes + "Crear operativo nuevo «…»" dentro de la misma lista.
// El nombre queda siempre al lado: sólo lectura si existe, obligatorio si es nuevo.
function SelectorOperativo(props: SelectorOperativoProps) {
    var { op, st, d, set } = props;
    var opciones: OpcionOperativo[] = op.operativos.map(o => ({ id: o.operativo, nombre: o.nombre, nuevo: false }));
    var actual: OpcionOperativo | null = !st.operativo ? null
        : d.operativo ? { id: d.operativo.operativo, nombre: d.operativo.nombre, nuevo: false }
        : { id: st.operativo, nombre: null, nuevo: true };
    var campoOp = (c: keyof DatosOperativo, label: string, obligatorio?: boolean, multilinea?: boolean) => {
        var editado = c in st.datosOperativo;
        return <TextField size="small" fullWidth label={label} value={d.datosOperativo[c]} required={!!obligatorio && d.operativoNuevo}
            multiline={multilinea} minRows={multilinea ? 3 : undefined}
            disabled={!d.operativoNuevo}
            onChange={e => set({ datosOperativo: { ...st.datosOperativo, [c]: e.target.value } })}
            helperText={!d.operativoNuevo ? ' ' : editado ? 'editado' : d.anterior ? 'sugerido' : ' '} />;
    };
    return <Stack spacing={1.5}>
        <Autocomplete size="small" autoHighlight openOnFocus options={opciones} value={actual}
            getOptionLabel={o => o.id}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={(ops, estado) => {
                var r = filtroOperativos(ops, estado);
                var txt = estado.inputValue.trim();
                if (txt && !ops.some(o => o.id === txt)) r.push({ id: txt, nombre: null, nuevo: true });
                return r;
            }}
            renderOption={(p, o) => <li {...p} key={o.id}>{o.nuevo
                ? <Typography color="primary">+ Crear operativo nuevo <b>{o.id}</b></Typography>
                : <Box><Typography sx={{ fontFamily: 'monospace' }}>{o.id}</Typography>
                    <Typography variant="caption" color="text.secondary">{o.nombre}</Typography></Box>}</li>}
            onChange={(_e, o) => set({
                operativo: o ? o.id : '',
                // si se parte de un operativo existente y se lo edita hasta uno nuevo (etoi264 -> etoipc271), el existente queda como base
                baseOperativo: o && o.nuevo ? (st.baseOperativo ?? d.operativo?.operativo ?? null) : null,
                datosOperativo: {}, servidor: null, dbSrv: null, manual: {}
            })}
            renderInput={p => <TextField {...p} label="Operativo" placeholder="escribí para buscar o crear"
                helperText={d.operativoNuevo ? 'Operativo nuevo: se crea al registrar.' : st.operativo ? 'Existe.' : 'Elegí uno existente o escribí uno nuevo.'} />} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 110px 110px' }, gap: 1.5 }}>
            {campoOp('nombre', 'Nombre del operativo', true)}
            {campoOp('annio', 'Año')}
            {campoOp('onda', 'Onda')}
        </Box>
        {campoOp('descripcion', 'Descripción', false, true)}
        {d.operativoNuevo && <Autocomplete size="small" options={op.operativos} value={d.anterior}
            getOptionLabel={o => o.operativo}
            isOptionEqualToValue={(a, b) => a.operativo === b.operativo}
            filterOptions={createFilterOptions<OperativoOpcion>({ stringify: o => o.operativo + ' ' + (o.nombre ?? '') })}
            renderOption={(p, o) => <li {...p} key={o.operativo}><Box>
                <Typography sx={{ fontFamily: 'monospace' }}>{o.operativo}</Typography>
                <Typography variant="caption" color="text.secondary">{o.nombre}</Typography>
            </Box></li>}
            onChange={(_e, o) => set({ baseOperativo: o ? o.operativo : null })}
            renderInput={p => <TextField {...p} label="Copiar los datos de (operativo base)"
                helperText={st.baseOperativo ? 'Elegido a mano. Borrá el campo para volver al más parecido.' : d.anterior ? 'El más parecido, automático. Cambialo si querés partir de otro.' : 'No hay uno parecido: elegí uno si querés partir de sus datos.'} />} />}
        {d.operativoNuevo && <Typography variant="caption" color="text.secondary">
            {d.anterior ? `Sugerido a partir de ${d.anterior.operativo}; el año y la onda se deducen del código (etoi264 → 2026, onda 4).` : 'No hay un operativo anterior parecido; el año y la onda se deducen del código cuando se puede.'}
        </Typography>}
    </Stack>;
}

function PantallaRegistrarInstancia(props: { op: OpcionesRegistro, recargar: () => Promise<void> }) {
    var { op, recargar } = props;
    var [st, setSt] = useState<Estado>({ operativo: '', baseOperativo: null, datosOperativo: {}, ambiente: op.ambientes.indexOf('prueba') >= 0 ? 'prueba' : (op.ambientes[0] ?? ''),
        tipo: 'normal', servidor: null, dbSrv: null, manual: {} });
    var [resultado, setResultado] = useState<{ ok: true, guardado: ResultadoRegistro } | { ok: false, mensaje: string } | null>(null);
    var [confirmando, setConfirmando] = useState(false);
    var [yaml, setYaml] = useState('');
    var [enviando, setEnviando] = useState(false);
    var [copiado, setCopiado] = useState(false);
    var set = useCallback((parche: Partial<Estado>) => { setSt(s => ({ ...s, ...parche })); setResultado(null); }, []);
    var d = useMemo(() => derivar(op, st), [op, st]);
    var probs = problemas(st, d);
    var cambiarManual = (campo: Campo, valor: string | null) => {
        var manual = { ...st.manual };
        if (valor === null) delete manual[campo]; else manual[campo] = valor;
        set({ manual });
    };
    var parametros = useMemo(() => aParametros(st, d), [st, d]);
    var detallesRepositorios = useMemo(() => {
        var m: Record<string, string> = {};
        op.repositorios.forEach(r => { m[r.repositorio] = urlGit(r); });
        return m;
    }, [op]);

    useEffect(() => {
        if (!parametros.instancia || !parametros.database) { setYaml(''); return; }
        var vigente = true;
        var timer = setTimeout(() => {
            myOwn.ajax.instancia_registrar_yaml(parametros).then(
                texto => { if (vigente) setYaml(texto); },
                err => { if (vigente) setYaml('# no se pudo armar el yaml: ' + err.message); }
            );
        }, 300);
        return () => { vigente = false; clearTimeout(timer); };
    }, [parametros]);

    var registrar = async () => {
        if (probs.length || enviando) return;
        setConfirmando(false);
        setEnviando(true);
        try {
            var guardado = await myOwn.ajax.instancia_registrar(parametros);
            await recargar();
            // el formulario vuelve a cero (conserva el ambiente) y queda a la vista lo que se guardó
            setSt(s => ({ operativo: '', baseOperativo: null, datosOperativo: {}, ambiente: s.ambiente, tipo: 'normal', servidor: null, dbSrv: null, manual: {} }));
            setResultado({ ok: true, guardado });
        } catch (err) {
            setResultado({ ok: false, mensaje: err instanceof Error ? err.message : String(err) });
        } finally {
            setEnviando(false);
        }
    };

    var plan: [string, string, [('success' | 'info' | 'error'), string] | null][] = [
        ['operativo', st.operativo || '—', st.operativo ? (d.operativoNuevo ? ['success', 'nuevo'] : ['info', 'existe']) : null],
        ['base', `${d.v.database || '—'} @ ${d.dbSrv || '?'}${d.servicioDb ? ` (${textoMotor(d.servicioDb)})` : ''}`, d.v.database ? (d.dbExiste ? ['info', 'reutiliza'] : ['success', 'nueva']) : null],
        ['instancia', `${d.v.instancia || '—'} (${st.ambiente})`, d.v.instancia ? (d.instanciaExiste ? ['error', 'ya existe'] : ['success', 'nueva']) : null],
        ['app', `${d.servidor || '?'}:${d.v.puerto}${d.v.base_url}`, null],
    ];

    var campo = (c: Campo, label: string, extra?: { mono?: boolean, lista?: string[], detalles?: Record<string, string>, disabled?: boolean }) =>
        <CampoTexto campo={c} label={label} st={st} d={d} cambiarManual={cambiarManual} {...extra} />;

    return <Box sx={{ p: 2, maxWidth: 1200 }}>
        <Typography variant="h5" component="h1" sx={{ mb: 2 }}>Registrar instancia</Typography>
        {resultado && resultado.ok && <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'success.main' }}>
            <Stack spacing={1.5}>
                <Alert severity="success">Registrado: {resultado.guardado.instancia} ({resultado.guardado.ambiente}). Esto es lo que se guardó:</Alert>
                <ResumenSecciones secciones={seccionesDeResultado(resultado.guardado)} />
                <Typography variant="caption" color="text.secondary">
                    El yaml de la instancia se baja de /config/{resultado.guardado.instancia}/{resultado.guardado.ambiente}. Falta crear la base en Postgres si no existe, y completar a mano el password.
                </Typography>
            </Stack>
        </Paper>}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 390px' }, gap: 2.5, alignItems: 'start' }}>
            <Stack spacing={2} sx={{ minWidth: 0 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                        <Typography variant="overline" color="text.secondary">Qué se instala</Typography>
                        <SelectorOperativo op={op} st={st} d={d} set={set} />
                        <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">Ambiente</Typography>
                                <ToggleButtonGroup size="small" exclusive color="primary" value={st.ambiente}
                                    onChange={(_e, x: string | null) => x && set({ ambiente: x, servidor: null, dbSrv: null, manual: {} })}>
                                    {op.ambientes.map(a => <ToggleButton key={a} value={a} sx={{ textTransform: 'none' }}>{a}</ToggleButton>)}
                                </ToggleButtonGroup>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">Tipo</Typography>
                                <ToggleButtonGroup size="small" exclusive color="primary" value={st.tipo}
                                    onChange={(_e, x: Tipo | null) => x && set({ tipo: x, manual: {} })}>
                                    <ToggleButton value="normal" sx={{ textTransform: 'none' }}>normal</ToggleButton>
                                    <ToggleButton value="dm" sx={{ textTransform: 'none' }}>dm</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr 1.3fr' }, gap: 1.5 }}>
                            {campo('instancia', 'Instancia', { mono: true })}
                            {campo('repositorio', 'Repositorio', { lista: op.repositorios.map(r => r.repositorio), detalles: detallesRepositorios })}
                            {campo('uso', 'Uso', { lista: op.usos })}
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.3fr 1.3fr' }, gap: 1.5 }}>
                            {campo('criticidad', 'Criticidad', { lista: CRITICIDADES })}
                            {campo('tolerancia_downtime', 'Tolerancia de downtime')}
                            {campo('so_user', 'Usuario del SO', { mono: true })}
                        </Box>
                    </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                        <Typography variant="overline" color="text.secondary">Dónde corre la app</Typography>
                        <Autocomplete size="small" disableClearable={!!d.srv} autoHighlight
                            options={op.servidores.slice().sort((x, y) => Number(y.servidor === d.servidorSugerido) - Number(x.servidor === d.servidorSugerido))}
                            value={d.srv}
                            getOptionLabel={s => s.host ? `${s.servidor} (${s.host})` : s.servidor}
                            filterOptions={filtroServidores}
                            isOptionEqualToValue={(x, y) => x.servidor === y.servidor}
                            onChange={(_e, s) => {
                                var manual = { ...st.manual }; delete manual.puerto;
                                set({ servidor: s ? s.servidor : '', dbSrv: null, manual });
                            }}
                            renderOption={(p, s) => <li {...p} key={s.servidor}><Box>
                                <Typography sx={{ fontFamily: 'monospace' }}>{s.servidor}{d.servidorSugerido === s.servidor ? ' · sugerido' : ''}</Typography>
                                <Typography variant="caption" color="text.secondary">{s.host ?? 'sin ip'} · {s.puertosUsados.length} instancias · próximo puerto {s.proximoPuerto}</Typography>
                            </Box></li>}
                            renderInput={p => <TextField {...p} label="Servidor de la app (nombre o ip)"
                                helperText={st.servidor !== null ? 'Elegido a mano.' : d.servidorSugerido ? `Sugerido: donde está la última instancia de este operativo en ${st.ambiente}.` : 'Este operativo no tiene instancias previas: elegí un servidor.'} />} />
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.5fr 1fr' }, gap: 1.5 }}>
                            {campo('base_url', 'base-url', { mono: true })}
                            {campo('puerto', 'Puerto de la app', { mono: true })}
                        </Box>
                        {d.srv && <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            puertos usados en {d.servidor}: {d.srv.puertosUsados.slice().sort((a, b) => b - a).slice(0, 6).join(' · ') || 'ninguno'} → {d.srv.proximoPuerto}
                        </Typography>}
                    </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                        <Typography variant="overline" color="text.secondary">Base de datos</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.3fr 1fr' }, gap: 1.5 }}>
                            <Autocomplete size="small" disableClearable={!!d.servicioDb} options={op.serviciosDb} value={d.servicioDb}
                                getOptionLabel={o => `${o.id}${o.host ? ` (${o.host})` : ''} · ${textoMotor(o)}`}
                                filterOptions={filtroServiciosDb}
                                isOptionEqualToValue={(a, b) => a.id === b.id}
                                onChange={(_e, o) => set({ dbSrv: o ? o.id : '' })}
                                renderOption={(p, o) => <li {...p} key={o.id}><Box>
                                    <Typography sx={{ fontFamily: 'monospace' }}>{o.id}</Typography>
                                    <Typography variant="caption" color={o.version ? 'text.secondary' : 'warning.main'}>{o.host ?? 'sin ip'} · {textoMotor(o)} · {o.bases} bases</Typography>
                                </Box></li>}
                                renderInput={p => <TextField {...p} label="Servidor de la base (nombre o ip · puerto · motor)"
                                    helperText={d.servicioDb && !d.servicioDb.version ? 'Este motor no tiene versión cargada en servidores_versiones. ' : st.dbSrv !== null ? 'Elegido a mano.' : d.dbSrvSugerido ? 'Sugerido: el más usado por las instancias de este servidor.' : 'Este servidor no tiene instancias previas: elegí uno.'} />} />
                            {campo('database', 'Nombre de la base', { mono: true })}
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                            {campo('db_owner', 'Owner', { mono: true, disabled: d.dbExiste })}
                            {campo('db_user', 'Usuario (admin)', { mono: true, disabled: d.dbExiste })}
                        </Box>
                        {!d.dbExiste && <React.Fragment>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1.5 }}>
                                {campo('db_schema', 'Esquema', { mono: true })}
                                {campo('db_periodo', 'Período')}
                                {campo('db_area', 'Área', { lista: op.areas })}
                                {campo('db_estado', 'Estado', { lista: ESTADOS_BASE })}
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1.5 }}>
                                {campo('db_seg_c', 'Seguridad: confidencialidad')}
                                {campo('db_seg_i', 'Seguridad: integridad')}
                                {campo('db_seg_d', 'Seguridad: disponibilidad')}
                                {campo('db_en_campo', 'En campo', { lista: ['sí', 'no'] })}
                            </Box>
                        </React.Fragment>}
                        {d.servicioDb && <Alert severity={d.dbExiste ? 'info' : 'success'} variant="outlined" sx={{ py: 0 }}>
                            {d.dbExiste
                                ? `${d.v.database} ya existe en ${d.dbSrv}: se reutiliza${st.tipo == 'dm' ? ' (lo normal para una instancia dm)' : ''}. Owner y usuario quedan los que tiene.`
                                : `Se registra ${d.v.database} en ${d.dbSrv} (${textoMotor(d.servicioDb)}). Owner y usuario siguen la convención <base>_owner / <base>_admin.`}
                        </Alert>}
                    </Stack>
                </Paper>

                {st.tipo == 'dm' && <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                        <Typography variant="overline" color="text.secondary">Instancia dm</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                            {campo('policy', 'server.policy', { mono: true })}
                            {campo('success_redirect', 'login.plus.successRedirect', { mono: true })}
                        </Box>
                    </Stack>
                </Paper>}
            </Stack>

            <Stack spacing={2} sx={{ minWidth: 0 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                        <Typography variant="overline" color="text.secondary">Se va a registrar</Typography>
                        {plan.map(([k, val, estado]) => <Box key={k} sx={{ display: 'grid', gridTemplateColumns: '78px minmax(0,1fr) auto', gap: 1, alignItems: 'baseline' }}>
                            <Typography variant="caption" color="text.secondary">{k}</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{val}</Typography>
                            {estado ? <Chip size="small" color={estado[0]} variant="outlined" label={estado[1]} /> : <span />}
                        </Box>)}
                        {probs.map(p => <Alert key={p} severity="error" sx={{ py: 0 }}>{p}</Alert>)}
                        <Button variant="contained" disabled={probs.length > 0 || enviando} onClick={() => setConfirmando(true)}>Revisar y registrar</Button>
                        {resultado && !resultado.ok && <Alert severity="error">{resultado.mensaje}</Alert>}
                    </Stack>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="overline" color="text.secondary">local-config.yaml</Typography>
                            <Button size="small" disabled={!yaml} onClick={() => {
                                copiarTexto(yaml).then(ok => { if (ok) { setCopiado(true); setTimeout(() => setCopiado(false), 1500); } });
                            }}>{copiado ? 'Copiado ✓' : 'Copiar'}</Button>
                        </Stack>
                        <Box component="pre" sx={{ m: 0, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, fontFamily: 'monospace', fontSize: 12, overflowX: 'auto', maxHeight: 340 }}>{yaml}</Box>
                        <Typography variant="caption" color="text.secondary">Lo mismo que devuelve /config/&lt;instancia&gt;. El password se agrega a mano en el servidor.</Typography>
                    </Stack>
                </Paper>
            </Stack>
        </Box>
        <Dialog open={confirmando} onClose={() => setConfirmando(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Esto es lo que se va a guardar</DialogTitle>
            <DialogContent dividers>
                {confirmando && <ResumenSecciones secciones={seccionesDeResultado(resultadoPrevio(st, d))} />}
                <Alert severity="info" sx={{ mt: 2 }}>
                    Sólo se registran estos datos en instrumentación. No se crea la base en Postgres, no se instala nada en el servidor y el password no se guarda.
                </Alert>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setConfirmando(false)}>Volver</Button>
                <Button variant="contained" disabled={enviando} onClick={registrar}>Confirmar y registrar</Button>
            </DialogActions>
        </Dialog>
    </Box>;
}

function Contenedor(props: { cargar: () => Promise<OpcionesRegistro> }) {
    var [op, setOp] = useState<OpcionesRegistro | null>(null);
    var [error, setError] = useState<string | null>(null);
    var recargar = useCallback(async () => { setOp(await props.cargar()); }, [props]);
    useEffect(() => { recargar().catch(err => setError(err instanceof Error ? err.message : String(err))); }, [recargar]);
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    if (!op) return <Typography sx={{ p: 2 }}>Cargando…</Typography>;
    return <PantallaRegistrarInstancia op={op} recargar={recargar} />;
}

myOwn.wScreens.instancia_registrar = function () {
    var mainLayout = document.getElementById('main_layout')!;
    var contenedor = document.createElement('div');
    mainLayout.appendChild(contenedor);
    ReactDOM.render(<Contenedor cargar={() => myOwn.ajax.instancia_registrar_opciones({})} />, contenedor);
};
