"use strict"

import { TableDefinition } from "backend-plus";

export function operativos():TableDefinition{
    const td:TableDefinition = {
        editable: true,
        name: 'operativos',
        fields: [
            {name:'operativo'   , typeName:'text'       },
            {name:'annio'       , typeName:'integer'    },
            {name:'onda'        , typeName:'text'       },
        ],
        primaryKey: ['operativo'],
    }
    return td
}