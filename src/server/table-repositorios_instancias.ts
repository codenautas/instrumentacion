"use strict";

import {TableDefinition} from "./types-instrumentacion"

export function repositorios_instancias(): TableDefinition {
    return {
        name: 'repositorios_instancias',
        elementName: 'repositorios_instancia',
        editable: false,
        fields: [
            {name: "repositorio",              typeName: "text"    },
            {name: "instancias",             typeName: "text"    },
            {name: "ambientes_instancias",   typeName: "text"    },
            {name: "usos_instancias",        typeName: "text"    },
            {name: "descripcion",                 typeName: "text"    , title:'descripción repositorio' },
            {name: "referente",            typeName: "text"    },
            {name: "servidor",               typeName: "text"    },
        ],
        sql:{
            isTable:false,
            from:`(SELECT 
                i.servidor,
                string_agg(i.instancia, '; ' ORDER BY i.instancia) AS instancias,
                string_agg(DISTINCT i.ambiente, '; ' ORDER BY i.ambiente) AS ambientes_instancias,
                string_agg(DISTINCT i.uso, '; ' ORDER BY i.uso) AS usos_instancias,
                r.*
            FROM repositorios r
            JOIN instapp i USING (repositorio)
            GROUP BY r.repositorio, servidor
            ORDER BY repositorio)`
        },
        primaryKey: ['repositorio']
    }
}