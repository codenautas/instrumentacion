"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function backups(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'backups',
        elementName: 'backup',
        editable: admin,
        fields: [
            { name: "database"           , typeName: 'text' },
            { name: "servidor"           , typeName: 'text' },
            { name: "servidor_destino"   , typeName: 'text' },
            { name: "path"               , typeName: 'text' },
            { name: "periodicidad"       , typeName: 'text' },
            { name: "metodo"             , typeName: 'text' },
        ],
        primaryKey: ['database','servidor','servidor_destino'],
        foreignKeys:[
            {references: 'databases'      , fields:['database']},
            {references: 'databases'      , fields:['servidor']},
            {references: 'databases'      , fields:[{source:'servidor_destino',target:'servidor'}],
        ],
    }
}
