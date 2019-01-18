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
            { name: "ip"                 , typeName: 'text'    },
            { name: "so"                 , typeName: 'text'    , label: "S.O."},
            { name: "pw"                 , typeName: 'text'    },
            { name: "infodisk"           , typeName: 'text'    , label:"df -h"},
            { name: "server_engine"      , typeName: 'text'    },
            { name: "conf_path"          , typeName: 'text'    },
            { name: "coderun"            , typeName: 'text'    },
            { name: "obs"                , typeName: 'text'    },
        ],
        primaryKey: ['servidor']
    }
}
