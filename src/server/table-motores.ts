"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function motores(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'motores',
        elementName: 'motor',
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
        ],
    }
}
