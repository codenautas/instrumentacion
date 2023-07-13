"use strict"

import { TableDefinition } from "backend-plus";

export function ambientes():TableDefinition{
    const td:TableDefinition = {
        editable: true,
        name: 'ambientes',
        fields: [
            {name:'ambiente', typeName:'text',},
        ],
        primaryKey: ['ambiente'],
    }
    return td
}