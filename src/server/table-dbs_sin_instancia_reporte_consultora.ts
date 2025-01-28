"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"
import { databases } from "./table-databases";

export function dbs_sin_instancia_reporte_consultora(_context: TableContext): TableDefinition {
    let tabledef = databases(_context)
    tabledef.name= 'dbs_sin_instancia_reporte_consultora'
    tabledef.elementName= 'db_sin_instancia_reporte_consultora'
    tabledef.editable= false
    tabledef.fields=[
        {name: "database",          typeName: "text"},
        {name: "servidor",            typeName: "text"},
        {name: "ip",            typeName: "text" },
        {name: "port",            typeName: "integer" },
        {name: "referentes_server",            typeName: "text" },
        {name: "estado",            typeName: "text" },
        {name: "eliminado",            typeName: "boolean" },
        {name: "server_eliminado",            typeName: "boolean" },
    ]
    tabledef.sql={
            isTable:false,
            from:`(select dbs.database, dbs.servidor, s.ip, dbs.port, s.referentes referentes_server, dbs.estado, dbs.eliminado, s.eliminado server_eliminado
                from databases dbs 
                left join servidores s using(servidor)
                left join instapp i on (dbs.servidor=i.db_servidor and dbs.database=i.database and dbs.port = i.db_port)
                where i.instancia is null and dbs.eliminado is not true and s.eliminado is not true
                order by database)`
    }
    tabledef.foreignKeys=[{references: 'servidores' , fields:['servidor']}]
    return tabledef
}