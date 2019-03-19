"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function areas(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'areas',
        elementName: 'area',
        editable: admin,
        fields: [
            { name: "area"                  , typeName: 'text' },
            { name: "proceso_iso"           , typeName: 'text' },
            { name: "dg_sdg_departamento"   , typeName: 'text' },
            { name: "periodo"               , typeName: 'text' },
            { name: "propietario"           , typeName: 'text' },
            { name: "fecusuarios_ref"       , typeName: 'text' },
            { name: "obs"                   , typeName: 'text' },
        ],
        primaryKey: ['area'],
        detailTables:[
            {table: 'databases'      , fields:['area'], abr:'D', label:'databases'    },
        ]
    }
}
