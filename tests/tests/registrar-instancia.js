"use strict";

const assert = require('assert/strict');
const { proximoPuertoApp, puertoDbHabitual, armarYamlConfig } = require('../../dist/server/registrar-instancia.js');
const { procedures } = require('../../dist/server/procedures-instrumentacion.js');

function clienteFalso(respuestas) {
    return {
        query(sql) {
            const clave = Object.keys(respuestas).find(k => sql.includes(k));
            const rows = respuestas[clave];
            return {
                fetchAll: async () => ({ rows }),
                fetchOneRowIfExists: async () => ({ row: rows[0] }),
            };
        }
    };
}

describe('registrar instancia', function () {
    it('el próximo puerto es el máximo del servidor más uno', async function () {
        const client = clienteFalso({ 'from instapp': [{ puerto: 3001 }, { puerto: 3010 }], 'from databases': [{ port: 5432 }] });
        assert.equal(await proximoPuertoApp(client, 'srv'), 3011);
    });
    it('sin instancias arranca en 3001', async function () {
        const client = clienteFalso({ 'from instapp': [], 'from databases': [] });
        assert.equal(await proximoPuertoApp(client, 'srv'), 3001);
    });
    it('saltea los puertos usados por bases de datos', async function () {
        const client = clienteFalso({ 'from instapp': [{ puerto: 5431 }], 'from databases': [{ port: 5432 }, { port: 5433 }] });
        assert.equal(await proximoPuertoApp(client, 'srv'), 5434);
    });
    it('puerto de db habitual con y sin bases', async function () {
        assert.equal(await puertoDbHabitual(clienteFalso({ 'from databases': [{ port: 5433 }] }), 's'), 5433);
        assert.equal(await puertoDbHabitual(clienteFalso({ 'from databases': [] }), 's'), 5432);
    });
    const base = { instancia: 'repsic261', ambiente: 'producción', puerto: 3091, base_url: '/repsic261', policy: null, success_redirect: null, so_user: null, version: '0.3.1', git_host: 'https://github.com/', git_group: '/es-ba/', git_project: 'repsic', db_host: '10.0.0.5', db_port: 5432, database: 'repsic261_db', db_user: 'repsic261_admin', db_schema: null, db_owner: 'repsic261_owner' };
    it('arma el yaml de una instancia común', function () {
        const yaml = armarYamlConfig(base);
        assert.match(yaml, /coderun:\n  version: 0\.3\.1\n/);
        assert.match(yaml, /server:\n  port: 3091\n  base-url: \/repsic261\n  user: repsic261\n/);
        assert.match(yaml, /git:\n  project: repsic\n  group: es-ba\n  host: https:\/\/github\.com\n/);
        assert.match(yaml, /db:\n  host: 10\.0\.0\.5\n  port: 5432\n  database: repsic261_db\n  user: repsic261_admin\n/);
        assert.match(yaml, /install:\n  dump:\n    db:\n      owner: repsic261_owner\n/);
        assert.match(yaml, /client-setup:\n  background-img: ""\n/);
        assert.match(yaml, /# install\.table-data-dir: .*\.\.\/dmencu-data\/repsic261\//);
        assert.doesNotMatch(yaml, /policy|login|schema/);
    });
    it('arma el yaml de una instancia dm', function () {
        const yaml = armarYamlConfig({ ...base, instancia: 'dmrepsic261', policy: 'web', success_redirect: '/campo' });
        assert.match(yaml, /  policy: web\n/);
        assert.match(yaml, /login:\n  plus:\n    successRedirect: \/campo\n/);
        assert.doesNotMatch(yaml, /table-data-dir/);
    });
    it('fuera de producción no pisa el fondo de test', function () {
        assert.doesNotMatch(armarYamlConfig({ ...base, ambiente: 'prueba' }), /background-img/);
    });
    it('el procedure instancia_registrar existe y es de admin', function () {
        const p = procedures.find(p => p.action === 'instancia_registrar');
        assert.deepEqual(p.roles, ['admin']);
    });
});

describe('pantalla registrar instancia', function () {
    const { AppBackend } = require('backend-plus');
    const { emergeAppInstrumentacion } = require('../../dist/server/app-instrumentacion.js');
    const { calcularProximoPuerto } = require('../../dist/server/registrar-instancia.js');
    const fs = require('fs');
    const path = require('path');
    const be = new (emergeAppInstrumentacion(AppBackend))();

    it('calcula el próximo puerto salteando los de las bases', function () {
        assert.equal(calcularProximoPuerto([], []), 3001);
        assert.equal(calcularProximoPuerto([3001, 3010], [5432]), 3011);
        assert.equal(calcularProximoPuerto([5431], [5432, 5433]), 5434);
    });
    it('el menú tiene la pantalla y el cliente la define', function () {
        const items = [];
        const recorrer = lista => lista.forEach(i => { items.push(i); if (i.menuContent) recorrer(i.menuContent); });
        recorrer(be.getMenu().menu);
        assert.ok(items.some(i => i.menuType === 'instancia_registrar' && i.name === 'instancia_registrar'));
        const cliente = fs.readFileSync(path.join(__dirname, '../../dist/client/ws-registrar-instancia.js'), 'utf8');
        assert.match(cliente, /wScreens\.instancia_registrar\s*=/);
    });
    // base sin los includes de backend-plus (necesitan la configuración completa y no vienen al caso)
    class BaseSinIncludes extends AppBackend { clientIncludes() { return []; } }
    const beIncludes = new (emergeAppInstrumentacion(BaseSinIncludes))();

    it('react y mui se incluyen siempre (se montan al arrancar) y la pantalla sólo para logueados', function () {
        const nombres = req => beIncludes.clientIncludes(req, {}).map(m => m.module || m.src || m.file);
        assert.ok(nombres(null).includes('react') && nombres(null).includes('@mui/material'));
        assert.ok(!nombres(null).includes('client/ws-registrar-instancia.js'));
        const logueado = nombres({ user: { usuario: 'x' } });
        assert.ok(logueado.indexOf('react') >= 0 && logueado.indexOf('react') < logueado.indexOf('react-dom'));
        assert.ok(logueado.includes('@mui/material'));
        assert.ok(logueado.includes('client/ws-registrar-instancia.js'));
    });
    it('los procedures de la pantalla son de admin', async function () {
        const procs = await be.getProcedures();
        ['instancia_registrar_opciones', 'instancia_registrar_yaml', 'instancia_registrar'].forEach(a => {
            const p = procs.find(x => x.action === a);
            assert.ok(p, a);
            assert.deepEqual(p.roles, ['admin'], a);
        });
    });
});

describe('yaml desde la grilla de instapp', function () {
    const fs = require('fs');
    const path = require('path');
    const { instapp } = require('../../dist/server/table-instapp.js');

    it('la columna yaml la ve sólo el admin', function () {
        const nombres = rol => instapp({ user: { rol } }).fields.map(f => f.name);
        assert.ok(nombres('admin').includes('yaml'));
        assert.ok(!nombres('otro').includes('yaml'));
        const campo = instapp({ user: { rol: 'admin' } }).fields.find(f => f.name === 'yaml');
        assert.equal(campo.clientSide, 'verYaml');
        assert.equal(campo.inTable, false);
    });
    it('el cliente define el clientSide verYaml y el procedure existe', async function () {
        const cliente = fs.readFileSync(path.join(__dirname, '../../dist/client/ws-yaml-instancia.js'), 'utf8');
        assert.match(cliente, /clientSides\.verYaml\s*=/);
        const { AppBackend } = require('backend-plus');
        const { emergeAppInstrumentacion } = require('../../dist/server/app-instrumentacion.js');
        const procs = await new (emergeAppInstrumentacion(AppBackend))().getProcedures();
        const p = procs.find(x => x.action === 'instancia_yaml_ver');
        assert.deepEqual(p.roles, ['admin']);
    });
});
