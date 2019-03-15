"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion"

export function instapp(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'instapp',
        elementName: 'instancia',
        editable: admin,
        fields: [
            { name: "instancia"     , typeName: 'text'    },
            { name: "servidor"      , typeName: 'text'    },
            { name: "ambiente"      , typeName: 'text'    },
            { name: "user"          , typeName: 'text'    },
            { name: "database"      , typeName: 'text'    },
            { name: "aplicacion"    , typeName: 'text'    },
            { name: "puerto"        , typeName: 'integer' },
            { name: "base_url"      , typeName: 'text'    },
            { name: "git_host"      , typeName: 'text'    },
            { name: "git_proyect"   , typeName: 'text'    },
            { name: "git_group"     , typeName: 'text'    },
        ],
        primaryKey: ['instancia','ambiente'],
        foreignKeys:[
            {references: 'servidores' , fields:['servidor'], abr:'S'/*, displayAllFields:true*/},
        ],
    }
}
