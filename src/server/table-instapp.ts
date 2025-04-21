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
            { name: "url_generada"        , typeName: 'text', inTable:false, label:'server.base_url + instapp.base_url'   },
            { name: "repositorio"         , typeName: 'text'    },
            { name: "operativo"           , typeName: 'text'    },
            { name: "criticidad"          , typeName: 'text'    },
            { name: "tolerancia_downtime" , typeName: 'text'    },
            { name: "servidor"            , typeName: 'text'    },
            { name: "puerto"              , typeName: 'integer' , label:'puerto_app'},
            { name: "user"                , typeName: 'text'    , visible:false },
            { name: "db_servidor"         , typeName: 'text'    },
            { name: "database"            , typeName: 'text'    },
            { name: "db_port"             , typeName: 'integer' },
            { name: "databases__owner"    , typeName: 'text'    , title:'owner_db'},
            { name: "databases__user"     , typeName: 'text'    , title:'user_db'},
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
        hiddenColumns:['ambientes__orden'],
        foreignKeys:[
            {references: 'servidores'   , fields:['servidor']},
            {references: 'databases'    , fields:[{source:'db_servidor', target:'servidor'}, 'database', {source:'db_port', target:'port'}]},
            {references: 'repositorios' , fields:['repositorio']},
            {references: 'operativos' , fields:['operativo']},
            {references: 'uso' , fields:['uso']},
            {references: 'ambientes' , fields:['ambiente'], displayFields:['orden']},
        ],
        sortColumns:[{column:'ambientes__orden', order:1},{column:'fecha_instalacion', order:-1}],
        constraints:[
            {consName:'database y db_port deben especificarse simultaneamente', constraintType:'check', expr:'(database is null) = (db_port is null)'}
        ],
        sql:{
            fields:{
                url_generada:{
                    expr:"(COALESCE(servidores.base_url, '')||COALESCE(instapp.base_url, ''))"
                }
            }
        }
    }
}
