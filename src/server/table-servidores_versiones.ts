"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function servidores_versiones(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'servidores_versiones',
        elementName: 'servidor_version',
        editable: admin,
        fields: [
            { name: "servidor"           , typeName: 'text' },
            { name: "producto"           , typeName: 'text' },
            { name: "version"            , typeName: 'text' },
            { name: "puerto"             , typeName: 'text' },
            { name: "obs"                , typeName: 'text' },
        ],
        primaryKey: ['servidor','producto','version'],
        foreignKeys:[
            {references: 'servidores'      , fields:['servidor']},
            {references: 'productos'       , fields:['producto']},
            {references: 'versiones'       , fields:['producto','version']},
        ],
        detailTables:[
            {table:'instapps_productos', fields:['servidor', 'producto', 'version'], abr:'I', label:'instancias'},
        ],
    }
}
