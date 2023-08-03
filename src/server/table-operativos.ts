"use strict"

import { TableDefinition } from "backend-plus";

export function operativos():TableDefinition{
    const td:TableDefinition = {
        editable: true,
        name: 'operativos',
        fields: [
            {name:'operativo'       , typeName:'text'       },
            {name:'nombre'          , typeName:'text'       },
            {name:'descripcion'     , typeName:'text'       , title:'descripción',   },
            {name:'annio'           , typeName:'integer'    , title:'año'           },
            {name:'onda'            , typeName:'text'       },
        ],
        primaryKey: ['operativo'],
        detailTables:[
            {table: 'instapp'      , fields:['operativo'], abr:'I', label:'Instancias'    },
        ]
    }
    return td
}