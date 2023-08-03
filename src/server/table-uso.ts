"use strict"

import { TableDefinition } from "backend-plus";

export function uso():TableDefinition{
    const td:TableDefinition = {
        editable: true,
        name: 'uso',
        fields: [
            {name:'uso', typeName:'text',},
            {name:'orden', typeName:'integer',},
        ],
        primaryKey: ['uso'],
    }
    return td
}