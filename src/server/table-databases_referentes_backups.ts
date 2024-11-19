"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function databases_referentes_backups(_context: TableContext): TableDefinition {
    return {
        name: 'databases_referentes_backups',
        elementName: 'database_referente_backup',
        editable: false,
        fields: [
            {name: "database",                   typeName: "text"},
            {name: "servidor",                   typeName: "text"},
            {name: "ip",                         typeName: "text"},
            {name: "port",                       typeName: "integer"},
            {name: "uso_servidor",               typeName: "text"},
            {name: "referentes_server",          typeName: "text"},
            {name: "responsable_backup_externo", typeName: "text"},
            {name: "instancias",                 typeName: "text"},
            {name: "operativos_instancias",            typeName: "text"},
            {name: "usos_instancias",            typeName: "text"},
            {name: "ambientes_instancias",       typeName: "text"},
            {name: "repositorios",               typeName: "text"},
            {name: "referentes_repos",           typeName: "text"},
        ],
        sql:{
            isTable:false,
            from:`(SELECT "db"."database", "db"."servidor", "s"."ip", "db"."port", s.uso uso_servidor, "s"."referentes" "referentes_server", "s"."usuario_backups_externos" "responsable_backup_externo", 
                    string_agg(ia.instancia, '; ' ORDER BY ia.instancia) AS instancias, 
                    string_agg(ia.operativo, '; ' ORDER BY ia.operativo) AS operativos_instancias,
                    string_agg(ia.uso, '; ' ORDER BY ia.uso) AS usos_instancias, 
                    string_agg(ia.ambiente, '; ' ORDER BY ia.ambiente) AS ambientes_instancias, 
                    string_agg(distinct "app"."repositorio", '; ' ORDER BY "app"."repositorio") AS repositorios,
                    string_agg(distinct "app"."referente", '; ' ORDER BY "app"."referente") AS referentes_repos
                FROM databases db 
                    LEFT JOIN servidores s using(servidor) 
                    LEFT JOIN instapp ia using(database) 
                    LEFT JOIN repositorios app using(repositorio)
                group by db.database, db.servidor, s.ip, db.port, s.uso, s.referentes, s.usuario_backups_externos
                ORDER BY responsable_backup_externo desc, db.servidor, referentes_repos, database)`
        },
        primaryKey: ['database','servidor','port']
    }
}