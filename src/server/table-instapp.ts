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
            { name: "uso"                 , typeName: 'text'    },
            { name: "base_url"            , typeName: 'text'    },
            { name: "aplicacion"          , typeName: 'text'    },
            { name: "operativo"           , typeName: 'text'    },
            { name: "database"            , typeName: 'text'    },
            { name: "servidor"            , typeName: 'text'    },
            { name: "user"                , typeName: 'text'    },
            { name: "db_port"             , typeName: 'integer' },
            { name: "puerto"              , typeName: 'integer' },
            { name: "version"             , typeName: 'text'    },
            { name: "bp_version"          , typeName: 'text'    },
            { name: "so_user"             , typeName: 'text'    },
            { name: "servicio"            , typeName: 'text'    },
            { name: "enabled"             , typeName: 'text'    },
            { name: "motor"               , typeName: 'text'    },
            { name: "so_path"             , typeName: 'text'    },
            { name: "categoria_doc"       , typeName: 'text'    },
            { name: "obs"                 , typeName: 'text'    },
        ],
        primaryKey: ['instancia','ambiente'],
        hiddenColumns:['ambientes__orden'],
        foreignKeys:[
            {references: 'servidores'   , fields:['servidor']},
            {references: 'databases'    , fields:['servidor', 'database', {source:'db_port', target:'port'}]},
            {references: 'aplicaciones' , fields:['aplicacion']},
            {references: 'categorias_doc' , fields:['categoria_doc']},
            {references: 'operativos' , fields:['operativo']},
            {references: 'ambientes' , fields:['ambiente'], displayFields:['orden']},
        ],
        sortColumns:[{column:'ambientes__orden', order:1},{column:'fecha_instalacion', order:-1}],
        constraints:[
            {consName:'database y db_port deben especificarse simultaneamente', constraintType:'check', expr:'(database is null) = (db_port is null)'}
        ]
    }
}
