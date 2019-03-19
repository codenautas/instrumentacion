"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function instapp(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'instapp',
        elementName: 'instancia',
        editable: admin,
        fields: [
            { name: "instancia"     , typeName: 'text'    },
            { name: "servidor"      , typeName: 'text'    },
            { name: "ambiente"      , typeName: 'text'    },
            { name: "user"          , typeName: 'text'    },
            { name: "database"      , typeName: 'text'    },
            { name: "db_port"       , typeName: 'integer' },
            { name: "aplicacion"    , typeName: 'text'    },
            { name: "puerto"        , typeName: 'integer' },
            { name: "base_url"      , typeName: 'text'    },
            { name: "git_host"      , typeName: 'text'    },
            { name: "git_proyect"   , typeName: 'text'    },
            { name: "git_group"     , typeName: 'text'    },
            { name: "obs"           , typeName: 'text'    },
        ],
        primaryKey: ['instancia','ambiente'],
        foreignKeys:[
            {references: 'servidores' , fields:['servidor']},
            {references: 'databases'  , fields:['servidor', 'database', {source:'db_port', target:'port'}]},
        ],
        constraints:[
            {consName:'database y db_port deben especificarse simultaneamente', constraintType:'check', expr:'(database is null) = (db_port is null)'}
        ]
    }
}
