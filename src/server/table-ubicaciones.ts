
import {TableDefinition, TableContext} from "./types-instrumentacion"

export function ubicaciones(context: TableContext): TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'ubicaciones',
        elementName: 'ubicación',
        editable: admin,
        fields: [
            { name: "ubicacion"          , typeName: 'text'    },
            { name: "descripcion"        , typeName: 'text'    },
            { name: "edificio"           , typeName: 'text'    },
        ],
        primaryKey: ['ubicacion'],
        detailTables: [
            { table: 'ip', fields: ['ubicacion'], abr: 'ip'}
        ]
    }
}
