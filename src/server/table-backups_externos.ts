"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function backups_externos(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'backups_externos',
        elementName: 'backup_externo',
        editable: admin,
        fields: [
            { name: "database"           , typeName: 'text' },
            { name: "servidor"           , typeName: 'text' },
            { name: "port"           , typeName: 'integer' },
            { name: "fecha"               , typeName: 'text' },
            { name: "exitoso"           , typeName: 'boolean' },
            { name: "error"           , typeName: 'text' },
            { name: "usuario_db_backup"   , typeName: 'text' },
            { name: "usuario_pc_responsable"   , typeName: 'text' },
        ],
        primaryKey: ['database','servidor','port','fecha'],
        foreignKeys:[
            {references: 'databases'      , fields:['database','servidor','port']},
            {references: 'servidores'     , fields:['servidor']},
            {references: 'usuarios' , fields:[{source:'usuario_pc_responsable', target:'usuario'}]},
        ],
    }
}
