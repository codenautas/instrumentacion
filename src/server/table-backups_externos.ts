"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function backups_externos(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'backups_externos',
        elementName: 'backup_externo',
        editable: admin,
        fields: [
            { name: "database",               editable: false, typeName: 'text' },
            { name: "servidor",               editable: false, typeName: 'text' },
            { name: "port",                   editable: false, typeName: 'integer' },
            { name: "fecha",                  editable: false, typeName: 'timestamp' },
            { name: "exitoso",                editable: false, typeName: 'boolean' },
            { name: "error",                  editable: false, typeName: 'text' },
            { name: "usuario_db_backup",      editable: false, typeName: 'text' },
            { name: "usuario_pc_responsable", editable: false, typeName: 'text' },
        ],
        primaryKey: ['database','servidor','port','fecha'],
        foreignKeys:[
            {references: 'databases'      , fields:['database','servidor','port']},
            {references: 'servidores'     , fields:['servidor']},
            {references: 'usuarios' , fields:[{source:'usuario_pc_responsable', target:'usuario'}]},
        ],
    }
}
