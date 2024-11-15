"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function servidores(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'servidores',
        elementName: 'servidor',
        editable: admin,
        fields: [
            { name: "servidor"           , typeName: 'text'    },
            { name: "hostname"           , typeName: 'text'    },
            { name: "ip"                 , typeName: 'text',   },
            { name: "uso"                , typeName: 'text'   },
            { name: "estado"             , typeName: 'text'   },
            { name: "obs"                , typeName: 'text', label: 'observaciones'},
            { name: "referentes"         , typeName: 'text' },
            { name: "usuario_backups_externos"   , typeName: 'text', title:'responsable backup externo'},
            { name: "ubicacion"          , typeName: 'text', label: 'ubicación'},
            { name: "so"                 , typeName: 'text'    , label: "S.O."},
            { name: "pw"                 , typeName: 'text'    },
            { name: "entorno"            , typeName: 'text'    },
            { name: "base_url"           , typeName: 'text'    },
            { name: "ip_anterior"        , typeName: 'text'    },
            { name: "infodisk"           , typeName: 'text'    , label:"df -h"},
        ],
        primaryKey: ['servidor'],
        foreignKeys:[
            {references: 'usuarios' , fields:[{source:'usuario_backups_externos', target:'usuario'}]},
        ],
        detailTables:[
            {table: 'databases'                , fields:['servidor'], abr:'D', label:'databases'    },
            {table: 'motores'                  , fields:['servidor'], abr:'M', label:'motores'      },
            {table: 'instapp'                  , fields:['servidor'], abr:'I', label:'instalaciones'},
            {table: 'operativos_instancias' , fields:['servidor'], abr:'O', label:'operativos'},
            {table: 'repositorios_instancias' , fields:['servidor'], abr:'R', label:'repositorios'},
        ],
    }
}
