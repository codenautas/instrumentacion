"use strict";

const assert = require('assert/strict');
const { procedures } = require('../../dist/server/procedures-instrumentacion.js');

describe('procedures', function () {
    it('api_call escapa la columna "when" (palabra reservada en SQL)', async function () {
        const api_call = procedures.find(p => p.action === 'api_call');
        let sqlEjecutado;
        const context = {
            client: {
                query(sql) {
                    sqlEjecutado = sql;
                    return { onRow: async () => ({ rowCount: 0 }) };
                }
            }
        };
        await api_call.coreFunction(context, { token: '' });
        assert.match(sqlEjecutado, /WHERE "when" IS NULL/);
    });
});
