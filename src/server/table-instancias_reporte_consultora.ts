"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function instancias_reporte_consultora(_context: TableContext): TableDefinition {
    return {
        name: 'instancias_reporte_consultora',
        elementName: 'instancia_reporte_consultora',
        editable: false,
        fields: [
            {name: "operativo",          typeName: "text"},
            {name: "sistema",            typeName: "text" , label:'inst.instancia'},
            {name: "descripcion",        typeName: "text", label:"inst.uso + repo.desc"},
            {name: "escenario",          typeName: "text", label:'inst.ambiente'},
            {name: "ip_server_app",      typeName: "text"},
            {name: "puerto_app",         typeName: "integer", label:'inst.puerto'},
            {name: "referentes",         typeName: "text", label:'coalesce(repo.referente, s.referentes)'},
            {name: "fuente",             typeName: "text", label:'repo (lenguaje + tipo_db + tecnologias)'},
            {name: "repositorio",        typeName: "text", label:'repo.git_host'},
            {name: "detalle_del_acceso", typeName: "text", label:'server.base_url + inst.base_url'},
            {name: "motor_db",           typeName: "text", label:'motor (producto + version)'},
            {name: "nombre_db",          typeName: "text"},
            {name: "ip_servidor_db",          typeName: "text"},
            {name: "puerto_db",          typeName: "integer"},
            {name: "server_eliminado",   typeName: "boolean"}
        ],
        sql:{
            isTable:false,
            from:`(SELECT ia.operativo, ia.instancia AS sistema, NULLIF(CONCAT_WS('; ', ia.uso, r.descripcion), '') AS descripcion,
                ia.ambiente AS escenario, s.ip AS ip_server_app, COALESCE(r.referente, s.referentes) AS referentes, 
                NULLIF(CONCAT_WS('; ', 
                        CASE WHEN r.lenguaje IS NOT NULL THEN 'lenguajes: ' || r.lenguaje END, 
                        CASE WHEN r.tipo_db IS NOT NULL THEN 'tipo db: ' || r.tipo_db END, 
                        CASE WHEN r.tecnologias IS NOT NULL THEN 'tecnologias: ' || r.tecnologias END
                ), '') AS fuente,
                ia.puerto AS puerto_app, r.git_host AS repositorio, NULLIF(CONCAT_WS('', s.base_url, ia.base_url), '') AS detalle_del_acceso, 
                NULLIF(CONCAT_WS(' ', m.producto, m.version), '') AS motor_db, ia.database AS nombre_db, ia.db_port AS puerto_db, 
                sb.ip AS ip_servidor_db, s.eliminado AS server_eliminado
            FROM instapp ia
            LEFT JOIN databases dbs ON ia.db_servidor = dbs.servidor AND ia.database=dbs.database AND ia.db_port = dbs.port
            LEFT JOIN servidores s ON ia.servidor=s.servidor
            LEFT JOIN servidores sb ON ia.db_servidor=sb.servidor
            LEFT JOIN repositorios r USING(repositorio)
            LEFT JOIN motores_instalados m ON sb.servidor=m.servidor AND (m.producto = 'postgres' OR m.producto = 'sqlserver') AND m.puerto=ia.db_port::text )`
        },
        primaryKey: ['sistema','escenario','ip_server_app']
    }
}