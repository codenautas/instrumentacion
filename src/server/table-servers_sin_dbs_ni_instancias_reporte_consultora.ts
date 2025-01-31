"use strict";

import { servidores } from "./table-servidores";
import {TableDefinition, TableContext} from "./types-instrumentacion"

export function servers_sin_dbs_ni_instancias_reporte_consultora(_context: TableContext): TableDefinition {
    let tabledef = servidores(_context)
    tabledef.name= 'servers_sin_dbs_ni_instancias_reporte_consultora'
    tabledef.elementName= 'server_sin_dbs_ni_instancias_reporte_consultora'
    tabledef.editable= false
    tabledef.fields=[
        { name: "servidor"   , typeName: 'text'    },
        { name: "ip"         , typeName: 'text',   },
        { name: "uso"        , typeName: 'text'   },
        { name: "estado"     , typeName: 'text'   },
        { name: "obs"        , typeName: 'text', label: 'observaciones'},
        { name: "referentes" , typeName: 'text' },
        { name: "obs"        , typeName: 'text' },
        { name: "eliminado"  , typeName: 'boolean' },
    ]
    tabledef.sql={
            isTable:false,
            from:`(select s.servidor, s.ip, s.uso, s.referentes, s.estado, s.eliminado, s.obs
                    from servidores s
                    left join instapp ia using (servidor)
                    left join databases dbs using (servidor)
                    where s.eliminado is not true and ia.instancia is null and (dbs.database is null or dbs.eliminado is true))`
    }
    tabledef.foreignKeys=[]
    return tabledef
}