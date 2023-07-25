"use strict"

import { TableDefinition } from "backend-plus";

export function ambientes():TableDefinition{
    const td:TableDefinition = {
        editable: true,
        name: 'ambientes',
        fields: [
            {name:'ambiente', typeName:'text'},
            {name:'orden', typeName:'integer'},
        ],
        primaryKey: ['ambiente'],
        sortColumns: [{column:'orden', order: 1}]
    }
    return td
}