"use strict"

import { TableDefinition } from "backend-plus";

export function categorias_doc():TableDefinition{
    const td:TableDefinition = {
        editable: true,
        name: 'categorias_doc',
        fields: [
            {name:'categoria_doc', typeName:'text',},
        ],
        primaryKey: ['categoria_doc'],
    }
    return td
}