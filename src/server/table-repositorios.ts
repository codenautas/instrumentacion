"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function repositorios(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'repositorios',
        elementName: 'repositorio',
        editable: admin,
        fields: [
            { name: "repositorio"    , typeName: 'text'     },
            { name: "descripcion"   , typeName: 'text',     title: 'descripción'},
            { name: "referente"     , typeName: 'text', isName:true     },
            { name: "git_host"      , typeName: 'text',     },
            { name: "git_group"     , typeName: 'text',     },
            { name: "git_project"   , typeName: 'text',     },
            { name: "obs"           , typeName: 'text',     },
            { name: "lenguaje"      , typeName: 'text',     },
            { name: "capac_ope"     , typeName: 'text',     },
            { name: "tipo_db"       , typeName: 'text',     },
            { name: "tecnologias"   , typeName: 'text',     },
        ],
        primaryKey: ['repositorio'],
        detailTables: [
            {table: 'instapp'      , fields:['repositorio'], abr:'I', label:'instancias'    },
        ]
    }
}
