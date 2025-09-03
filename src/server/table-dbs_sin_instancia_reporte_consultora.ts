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
        {name: "servidor",          typeName: "text"},
        {name: "ip",                typeName: "text" },
        {name: "motor_db",          typeName: "text"},
        {name: "port",              typeName: "integer"},
        {name: "referentes_server", typeName: "text" },
        {name: "estado",            typeName: "text" },
        {name: "obs",            typeName: "text" },
        {name: "eliminado",         typeName: "boolean" },
        {name: "server_eliminado",  typeName: "boolean" },
    ]
    tabledef.sql={
            isTable:false,
            from:`(SELECT dbs.database, dbs.servidor, s.ip, (m.producto||m.version) motor_db, dbs.port, s.referentes referentes_server, dbs.estado, dbs.obs, dbs.eliminado, s.eliminado server_eliminado
                FROM databases dbs 
                LEFT JOIN servidores s USING(servidor)
                LEFT JOIN motores_instalados m ON s.servidor=m.servidor and (m.producto = 'postgres' or m.producto = 'sqlserver') and m.puerto=dbs.port::text
                LEFT JOIN instapp i ON (dbs.servidor=i.db_servidor AND dbs.database=i.database AND dbs.port = i.db_port)
                WHERE i.instancia is null AND dbs.eliminado is not true AND s.eliminado is not true
                ORDER BY database)`
    }
    tabledef.foreignKeys=[{references: 'servidores' , fields:['servidor']}]
    return tabledef
}