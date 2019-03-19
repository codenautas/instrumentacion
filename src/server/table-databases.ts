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
            { name: "owner"                 , typeName: 'text'    },
            { name: "user"                  , typeName: 'text'    },
            { name: "schema"                , typeName: 'text'    },
            { name: "search_path"           , typeName: 'text'    },
            { name: "sistema"               , typeName: 'text'    },
            { name: "periodo"               , typeName: 'text'    },
            { name: "area"                  , typeName: 'text'    },
            { name: "estado"                , typeName: 'text'    },
            { name: "en_campo"              , typeName: 'boolean' },
            { name: "seg_confidencialidad"  , typeName: 'integer' },
            { name: "seg_integridad"        , typeName: 'integer' },
            { name: "seg_disponibilidad"    , typeName: 'integer' },
            { name: "url"                   , typeName: 'text'    },
            { name: "path_interno"          , typeName: 'text'    },
            { name: "so_user"               , typeName: 'text'    },
            { name: "servicio"              , typeName: 'text'    },
            { name: "enabled"               , typeName: 'boolean' },
            { name: "motor"                 , typeName: 'text'    },
            { name: "so_path"               , typeName: 'text'    },
            { name: "fuente"                , typeName: 'text'    },
            { name: "obs"                   , typeName: 'text'    },
        ],
        primaryKey: ['database','servidor','port'],
        foreignKeys:[
            {references: 'servidores' , fields:['servidor']},
            {references: 'areas' , fields:['area']},
        ],
        detailTables:[
            {table: 'backups'      , fields:['database'], abr:'B', label:'backups'},
            {table: 'instapp'      , fields:['servidor','database',{source:'port', target:'db_port'}], abr:'I', label:'instalaciones'},
        ],
    }
}