"use strict";

import {TableDefinition, TableContext, FieldDefinition} from "./types-instrumentacion"

export function databases_referentes_backups(_context: TableContext): TableDefinition {
    const fieldsToShow = [
        {name: "database",                   typeName: "text", tableAliasPrefix:'db'},
        {name: "servidor",                   typeName: "text", tableAliasPrefix:'db'},
        {name: "ip",                         typeName: "text", tableAliasPrefix:'s'},
        {name: "port",                       typeName: "integer", tableAliasPrefix:'db'},
        {name: "referentes",                 typeName: "text", tableAliasPrefix:'s', fieldAlias:'referentes_server'},
        {name: "usuario_backups_externos",   typeName: "text", tableAliasPrefix:'s', fieldAlias:'responsable_backup_externo'},
        {name: "instancia",                  typeName: "text", tableAliasPrefix:'ia', fieldAlias:'instapp'},
        {name: "aplicacion",                 typeName: "text", tableAliasPrefix:'app'},
        {name: "referente",                  typeName: "text", tableAliasPrefix:'app', fieldAlias:'referente_app'},
    ];
    const qi = _context.be.db.quoteIdent;
    return {
        name: 'databases_referentes_backups',
        elementName: 'database_referente_backup',
        editable: false,
        fields: fieldsToShow.map(f => <FieldDefinition>{typeName: f.typeName, name:f.fieldAlias||f.name}),
        sql:{
            isTable:false,
            from:`(SELECT ${fieldsToShow.map(f=>qi(f.tableAliasPrefix)+'.'+qi(f.name)+ (f.fieldAlias?' '+qi(f.fieldAlias):'')).join(', ')}
                FROM databases db LEFT JOIN servidores s using(servidor) LEFT JOIN instapp ia using(database) LEFT JOIN aplicaciones app using(aplicacion)
                ORDER BY responsable_backup_externo desc, db.servidor, referente_app, database)`
        },
        primaryKey: ['database','servidor','port']
    }
}