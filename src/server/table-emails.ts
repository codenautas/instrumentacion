"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion";

export function emails(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'emails',
        elementName:'emails',
        editable:admin,
        fields:[
            {name:'instancia', typeName:'text'},
            {name:'ambiente', typeName:'text'},
            {name:'email', typeName:'text'},
            {name:'descripcion', typeName:'text'},
            {name:'password_update_date', typeName:'date', title: 'fecha cambio contraseña'},
        ],
        primaryKey:['instancia', 'ambiente', 'email'],
        foreignKeys: [
            {references: 'instapp', fields: ['instancia', 'ambiente']},
        ],
    };
}
