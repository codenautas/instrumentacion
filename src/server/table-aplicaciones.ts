"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function aplicaciones(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'aplicaciones',
        elementName: 'aplicacion',
        editable: admin,
        fields: [
            { name: "aplicacion"    , typeName: 'text',     title: 'aplicación' },
            { name: "descripcion"   , typeName: 'text',     title: 'descripción'},
            { name: "git_host"      , typeName: 'text',     },
            { name: "git_group"     , typeName: 'text',     },
            { name: "git_project"   , typeName: 'text',     },
            { name: "version"       , typeName: 'text',     },
            { name: "bp_version"    , typeName: 'text',     description:'versión de backendplus'},
            { name: "obs"           , typeName: 'text',     },
            { name: "lenguaje"           , typeName: 'text',     },
            { name: "capac_ope"           , typeName: 'text',     },
            { name: "tipo_db"           , typeName: 'text',     },
            { name: "tecnologias"           , typeName: 'text',     },
        ],
        primaryKey: ['aplicacion'],
        detailTables: [
            {table: 'instapp'      , fields:['aplicacion'], abr:'I', label:'instancias'    },
        ]
    }
}
