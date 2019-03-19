"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function productos(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'productos',
        elementName: 'producto',
        editable: admin,
        fields: [
            { name: "producto"           , typeName: 'text' },
            { name: "tipo"               , typeName: 'text' },
        ],
        primaryKey: ['producto'],
    }
}
