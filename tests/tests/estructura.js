"use strict";

// Chequea la consistencia de las definiciones de tablas, el menú y los procedures
// sin necesitar base de datos: instancia la app y recorre lo que backend-plus va a usar.

const assert = require('assert/strict');
const { AppBackend } = require('backend-plus');
const { emergeAppInstrumentacion } = require('../../dist/server/app-instrumentacion.js');

const AppInstrumentacion = emergeAppInstrumentacion(AppBackend);

// tablas que provee backend-plus y pueden ser referenciadas
const TABLAS_DE_BACKEND_PLUS = ['bitacora', 'summary', 'tokens'];

function nombreCampo(f, lado) {
    return typeof f === 'string' ? f : f[lado];
}

describe('estructura de la aplicación', function () {
    let be;
    let tablas;
    let definiciones;

    before(function () {
        be = new AppInstrumentacion();
        be.db = require('pg-promise-strict'); // lo que backend-plus asigna al arrancar
        be.prepareGetTables();
        tablas = be.getTableDefinition;
        definiciones = {};
        for (const rol of ['admin', 'user']) {
            for (const nombre of Object.keys(tablas)) {
                const def = tablas[nombre]({ be, user: { usuario: 'test', rol } });
                if (rol === 'admin') definiciones[nombre] = def;
            }
        }
    });

    it('cada tabla se llama igual que la clave con que se registra', function () {
        for (const [nombre, def] of Object.entries(definiciones)) {
            assert.equal(def.name, nombre);
        }
    });

    it('no hay campos repetidos', function () {
        for (const [nombre, def] of Object.entries(definiciones)) {
            const nombres = def.fields.map(f => f.name);
            assert.deepEqual(nombres.filter((n, i) => nombres.indexOf(n) !== i), [], nombre);
        }
    });

    it('la primary key usa campos existentes', function () {
        for (const [nombre, def] of Object.entries(definiciones)) {
            const campos = def.fields.map(f => f.name);
            assert.ok(def.primaryKey && def.primaryKey.length > 0, `${nombre} sin primaryKey`);
            for (const pk of def.primaryKey) {
                assert.ok(campos.includes(pk), `${nombre}.primaryKey: ${pk} no es un campo`);
            }
        }
    });

    it('las foreign keys apuntan a tablas y campos existentes', function () {
        for (const [nombre, def] of Object.entries(definiciones)) {
            const campos = def.fields.map(f => f.name);
            for (const fk of def.foreignKeys || []) {
                if (TABLAS_DE_BACKEND_PLUS.includes(fk.references)) continue;
                const ref = definiciones[fk.references];
                assert.ok(ref, `${nombre} referencia a ${fk.references} que no está registrada`);
                const camposRef = ref.fields.map(f => f.name);
                for (const f of fk.fields) {
                    assert.ok(campos.includes(nombreCampo(f, 'source')), `${nombre} fk a ${fk.references}: falta ${nombreCampo(f, 'source')}`);
                    assert.ok(camposRef.includes(nombreCampo(f, 'target')), `${nombre} fk a ${fk.references}: ${fk.references} no tiene ${nombreCampo(f, 'target')}`);
                }
            }
        }
    });

    it('las detailTables apuntan a tablas existentes con los campos de la relación', function () {
        for (const [nombre, def] of Object.entries(definiciones)) {
            const campos = def.fields.map(f => f.name);
            for (const dt of def.detailTables || []) {
                const det = definiciones[dt.table];
                assert.ok(det, `${nombre} tiene detailTable ${dt.table} que no está registrada`);
                const camposDet = det.fields.map(f => f.name);
                for (const f of dt.fields) {
                    assert.ok(campos.includes(nombreCampo(f, 'source')), `${nombre} detalle ${dt.table}: falta ${nombreCampo(f, 'source')}`);
                    assert.ok(camposDet.includes(nombreCampo(f, 'target')), `${nombre} detalle ${dt.table}: ${dt.table} no tiene ${nombreCampo(f, 'target')}`);
                }
            }
        }
    });

    it('databases y servidores tienen la columna eliminado que usan los reportes de la consultora', function () {
        for (const nombre of ['databases', 'servidores']) {
            assert.ok(definiciones[nombre].fields.some(f => f.name === 'eliminado'), `${nombre}: falta eliminado`);
        }
        assert.equal(definiciones.databases.fields.find(f => f.name === 'eliminado').visible, false);
        for (const nombre of ['dbs_sin_instancia_reporte_consultora', 'servers_sin_dbs_ni_instancias_reporte_consultora']) {
            assert.match(definiciones[nombre].sql.from, /\beliminado\b/, `${nombre} dejó de usar eliminado`);
        }
    });

    it('sólo los admin pueden editar, salvo las tablas editables por todos', function () {
        // TODO: confirmar si estas tablas deben ser editables por cualquier usuario
        const EDITABLES_POR_TODOS = ['ambientes', 'operativos', 'textos_doc', 'uso'];
        for (const nombre of Object.keys(tablas)) {
            const def = tablas[nombre]({ be, user: { usuario: 'test', rol: 'user' } });
            assert.equal(!!def.editable, EDITABLES_POR_TODOS.includes(nombre), `${nombre}: editable para un usuario no admin`);
        }
    });

    it('el menú sólo nombra tablas y procedures existentes', async function () {
        const procedures = (await be.getProcedures()).map(p => p.action);
        const recorrer = (items) => {
            for (const item of items) {
                if (item.menuType === 'table') {
                    assert.ok(tablas[item.name] || TABLAS_DE_BACKEND_PLUS.includes(item.name), `menú: tabla ${item.name} no registrada`);
                } else if (item.menuType === 'proc') {
                    assert.ok(procedures.includes(item.name), `menú: procedure ${item.name} no existe`);
                }
                if (item.menuContent) recorrer(item.menuContent);
            }
        };
        recorrer(be.getMenu().menu);
    });
});
