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
            {name: "puerto_db",          typeName: "integer"},
            {name: "server_eliminado",   typeName: "boolean"}
        ],
        sql:{
            isTable:false,
            from:`(SELECT ia.operativo, ia.instancia sistema, (ia.uso||'; '||r.descripcion) descripcion, ia.ambiente escenario, s.ip ip_server_app, 
coalesce(r.referente, s.referentes) referentes, 
('lenguajes: '||r.lenguaje||'; tipo db: '||r.tipo_db||'; tecnologias: '||r.tecnologias) fuente, 
ia.puerto puerto_app, r.git_host repositorio, (s.base_url||ia.base_url) as detalle_del_acceso, 
(m.producto||m.version) motor_db, ia.database nombre_db, ia.db_port puerto_db, sb.ip ip_servidor_db,
s.eliminado server_eliminado
from instapp ia
left join databases dbs on ia.db_servidor = dbs.servidor AND ia.database=dbs.database AND ia.db_port = dbs.port
left join servidores s on ia.servidor=s.servidor
left join servidores sb on ia.db_servidor=sb.servidor
left join repositorios r using(repositorio)
left join motores m on s.servidor=m.servidor and (m.producto = 'postgres' or m.producto = 'sqlserver') and m.puerto=ia.db_port::text
)`
        },
        primaryKey: ['sistema','escenario','ip_server_app']
    }
}