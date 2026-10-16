"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function databases(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'databases',
        elementName: 'database',
        editable: admin,
        fields: [
            { name: "database"              , typeName: 'text'    },
            { name: "servidor"              , typeName: 'text'    },
            { name: "port"                  , typeName: 'integer' },
            { name: "owner"                 , typeName: 'text', isName:true  },
            { name: "user"                  , typeName: 'text', isName:true  },
            { name: "schema"                , typeName: 'text'    },
            { name: "sistema"               , typeName: 'text'    },
            { name: "periodo"               , typeName: 'text'    },
            { name: "area"                  , typeName: 'text'    },
            { name: "estado"                , typeName: 'text'    },
            // NO SACAR: aunque no se muestra, la columna tiene que existir porque la usan los reportes
            // dbs_sin_instancia_reporte_consultora y servers_sin_dbs_ni_instancias_reporte_consultora (dbs.eliminado).
            // Sin ella esos reportes fallan (y también en cualquier base nueva creada con el dump).
            { name: "eliminado"             , typeName: 'boolean', visible: false },
            { name: "en_campo"              , typeName: 'boolean' },
            { name: "seg_confidencialidad"  , typeName: 'integer' },
            { name: "seg_integridad"        , typeName: 'integer' },
            { name: "seg_disponibilidad"    , typeName: 'integer' },
            { name: "obs"                   , typeName: 'text'    },
        ],
        primaryKey: ['database','servidor','port'],
        foreignKeys:[
            {references: 'servidores' , fields:['servidor']},
            {references: 'areas' , fields:['area']},
        ],
        detailTables:[
            {table: 'databases_referentes_backups' , fields:['database'], abr:'BE', label:'backups_externos'},
            {table: 'backups'      , fields:['database'], abr:'BI', label:'backups internos en server'},
            {table: 'instapp'      , fields:[{source:'servidor', target:'db_servidor'},'database',{source:'port', target:'db_port'}], abr:'I', label:'instalaciones'},
        ],
    }
}