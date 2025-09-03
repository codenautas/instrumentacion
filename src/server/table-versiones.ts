"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

/**
 * - version: campo calculado no presente en la tabla = concatenación de version_gral_soportada + '.' + version_parche
 * - seg_verificada: se tilda manualmente cuando se agrega si es la versión patch más segura para la version_base soportada (solo puede haber una por cada version_base soportada), se destilda automaticamente por cron job o trigger o script si la ultima_verif_seg es anterior a 2 meses desde hoy; también se destilda cuando la version_base deja de tener soporte de seguridad (fin_soporte_seg); (TODO: por ahora se está haciendo esto manualmente)
 * - ultima_verif_seg: la fecha en la que se tildó el campo seg_verificada
 */
export function versiones(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'versiones',
        elementName: 'version',
        editable: admin,
        fields: [
            { name: "producto"           , typeName: 'text' }, // fk + pk
            { name: "version"            , typeName: 'text'}, // pk
            { name: "version_base"       , typeName: 'text' }, // fk
            { name: "seg_verificada"     , typeName: 'boolean'}, // Uk ; manual y calculada
            { name: "ultima_verif_seg"   , typeName: 'date' }, // manual y calculada
            { name: "url"                , typeName: 'text' },
            { name: "release"            , typeName: 'date' },
            { name: "descripcion"        , typeName: 'text' },
        ],
        primaryKey: ['producto', 'version'],
        foreignKeys:[
            {references: 'productos'       , fields:['producto']},
            {references: 'versiones_base' , fields:['producto','version_base']},
        ],
        constraints: [
            {constraintType:'unique', consName:'versiones_uk_producto-version_base-seg_verificada', fields:['producto', 'version_base', 'seg_verificada']},
            {constraintType:'check', consName:'versiones-version_base-prefijo-version', expr:`version LIKE version_base || '.%'`},
        ],
    }
}
