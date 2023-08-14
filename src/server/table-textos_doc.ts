"use strict"

import { TableDefinition } from "backend-plus";

export function textos_doc():TableDefinition{
    const td:TableDefinition = {
        editable: true,
        name: 'textos_doc',
        fields: [
            {name:'codigo', typeName:'text',},
            {name:'texto', typeName:'text',},
        ],
        primaryKey: ['codigo'],
    }
    return td
}