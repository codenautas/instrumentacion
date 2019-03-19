
import {TableDefinition, TableContext} from "./types-instrumentacion"

export function ip(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'ip',
        elementName: 'I.P.',
        editable: admin,
        fields: [
            { name: "ip"                 , typeName: 'text'    },
            { name: "ubicacion"          , typeName: 'text'    },
            { name: "uhabitual"          , typeName: 'text'    },
            { name: "tmp_ubicacion"      , typeName: 'text'    },
            { name: "tmp_uhabitual"      , typeName: 'text'    },
            { name: "obs"                , typeName: 'text'    },
        ],
        primaryKey: ['ip'],
        foreignKeys: [
            {references:'ubicaciones'    , fields:['ubicacion']               },
        ],
        detailTables: [
            { table: 'user_agents', fields: ['ip'], abr: 'ua'}
        ]
    }
}
