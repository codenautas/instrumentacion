"use strict";

import {TableDefinition} from "./types-instrumentacion"

export function operativos_instancias(): TableDefinition {
    return {
        name: 'operativos_instancias',
        elementName: 'operativos_instancia',
        editable: false,
        fields: [
            {name: "operativo",              typeName: "text"    },
            {name: "annio",                  typeName: "integer" , title: 'año'},
            {name: "instancias",             typeName: "text"    },
            {name: "ambientes_instancias",   typeName: "text"    },
            {name: "usos_instancias",        typeName: "text"    },
            {name: "nombre",                 typeName: "text"    , title:'nombre operativo' },
            {name: "descripcion",            typeName: "text"    },
            {name: "onda",                   typeName: "text"    },
            {name: "servidor",               typeName: "text"    },
        ],
        sql:{
            isTable:false,
            from:`(SELECT 
                    i.servidor,
                    string_agg(i.instancia, '; ' ORDER BY i.instancia) AS instancias,
                    string_agg(DISTINCT i.ambiente, '; ' ORDER BY i.ambiente) AS ambientes_instancias,
                    string_agg(DISTINCT i.uso, '; ' ORDER BY i.uso) AS usos_instancias,
                    o.*
                FROM operativos o
                JOIN instapp i USING (operativo)
                GROUP BY o.operativo, servidor
                ORDER BY operativo)`
        },
        primaryKey: ['operativo']
    }
}