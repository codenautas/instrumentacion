"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

// tabla intermedia entre instapp y versiones de productos
export function instapps_productos(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'instapps_productos',
        elementName: 'instapp_producto',
        editable: admin,
        fields: [
            { name: "servidor"           , typeName: 'text' }, // ambas tablas lo tienen como pk y fk
           
            { name: "instancia"           , typeName: 'text'}, // pk de instapp
            { name: "ambiente"            , typeName: 'text'}, // pk de instapp
           
            { name: "producto"           , typeName: 'text' }, // pk de versiones
            { name: "version"            , typeName: 'text' }, // pk de versiones

            { name: "obs"                 , typeName: 'text'}, // aqui info util de dicha relación
        ],
        primaryKey: ['servidor', 'instancia', 'ambiente', 'producto'],
        foreignKeys:[
            {references: 'servidores' , fields:['servidor']},
            {references: 'instapp'    , fields:['instancia','ambiente']},
            // {references: 'ambientes'  , fields:['ambiente']},
            {references: 'productos'  , fields:['producto']},
            {references: 'versiones'  , fields:['producto','version']},
        ],
    }
}
