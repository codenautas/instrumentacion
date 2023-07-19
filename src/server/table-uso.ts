"use strict"

import { TableDefinition } from "backend-plus";

export function uso():TableDefinition{
    const td:TableDefinition = {
        editable: true,
        name: 'uso',
        fields: [
            {name:'uso', typeName:'text',},
        ],
        primaryKey: ['uso'],
    }
    return td
}