"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function aplicaciones(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'aplicaciones',
        elementName: 'aplicacion',
        editable: admin,
        fields: [
            { name: "aplicacion"    , typeName: 'text'    }
            { name: "git_host"      , typeName: 'text'    },
            { name: "git_project"   , typeName: 'text'    },
            { name: "git_group"     , typeName: 'text'    },
            { name: "obs"           , typeName: 'text'    },
        ],
        detailTables: [
            {table: 'instapp'      , fields:['aplicacion'], abr:'I', label:'instancias'    },
        ]
        primaryKey: ['aplicacion'],
    }
}
