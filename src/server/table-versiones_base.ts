"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

/**
* - version_base: es la version general soportada para la que se define una fecha_fin_soporte, la que si cambia rompe compatibilidad, por lo gral major, pero podría ser major + minor, por lo que en este campo aveces va a ir un solo número (ej: 2) y otras veces dos números (ej: 2.1)
* - fin_soporte_seg: fecha en la que se deja de dar soporte de seguridad entendiendo por "soporte de seguridad" lo que nosotros consideremos (parches de seguridad o de seguridad + bugs críticos)
* - soporte_seg_actual: automaticamente se tilda si la version_base sigue teniendo soporte de seguridad en la fecha actual (fin_soporte_seg) y se destilda cuando "caduca" (por cron job o trigger o script), TODO: por ahora se está haciendo manual
 */
export function versiones_base(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'versiones_base',
        elementName: 'version_base',
        editable: admin,
        fields: [
            { name: "producto"             , typeName: 'text' }, // pk , fk
            { name: "version_base"         , typeName: 'text' }, // pk
            { name: "fin_soporte_seg"      , typeName: 'date' },
            // { name: "soporte_seg_actual"   , typeName: 'boolean', isName:true, inTable:false }, //TODO: calcular automaticamente
            { name: "nombre"               , typeName: 'text' },
            { name: "url"                  , typeName: 'text' },
            { name: "release"              , typeName: 'date' },
            { name: "descripcion"          , typeName: 'text' },
        ],
        primaryKey: ['producto','version_base'],
        foreignKeys:[
            {references: 'productos'       , fields:['producto']},
        ],
        detailTables:[
            {table: 'versiones' , fields:['producto','version_base'], abr:'VC', label:'versiones completas'},
        ],
    }
}
