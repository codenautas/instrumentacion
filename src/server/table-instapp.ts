"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function instapp(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'instapp',
        elementName: 'instancia',
        editable: admin,
        fields: [
            { name: "instancia"           , typeName: 'text'    },
            { name: "fecha_instalacion"   , typeName: 'date'    ,specialDefaultValue:'current_date'},
            { name: "ambiente"            , typeName: 'text'    },
            { name: "aplicacion"          , typeName: 'text'    },
            { name: "servidor"            , typeName: 'text'    },
            { name: "user"                , typeName: 'text'    },
            { name: "database"            , typeName: 'text'    },
            { name: "db_port"             , typeName: 'integer' },
            { name: "puerto"              , typeName: 'integer' },
            { name: "base_url"            , typeName: 'text'    },
            { name: "version"             , typeName: 'text'    },
            { name: "bp_version"          , typeName: 'text'    },
            { name: "so_user"             , typeName: 'text'    },
            { name: "servicio"            , typeName: 'text'    },
            { name: "enabled"             , typeName: 'text'    },
            { name: "motor"               , typeName: 'text'    },
            { name: "so_path"             , typeName: 'text'    },
            { name: "obs"                 , typeName: 'text'    },
        ],
        primaryKey: ['instancia','ambiente'],
        foreignKeys:[
            {references: 'servidores'   , fields:['servidor']},
            {references: 'databases'    , fields:['servidor', 'database', {source:'db_port', target:'port'}]},
            {references: 'aplicaciones' , fields:['aplicacion']},
        ],
        constraints:[
            {consName:'database y db_port deben especificarse simultaneamente', constraintType:'check', expr:'(database is null) = (db_port is null)'}
        ]
    }
}
