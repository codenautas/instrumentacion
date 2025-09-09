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
            { name: "tipo"               , typeName: 'text', options: ['dbms', 'entorno_ejecucion_lenguaje', 'sistema_operativo', 'otro'] },
            { name: "descripcion"        , typeName: 'text' }
        ],
        primaryKey: ['producto'],
        detailTables:[
            {table:'instapps_productos', fields:['producto'], abr:'I', label:'instapps'},
        ],
    }
}
