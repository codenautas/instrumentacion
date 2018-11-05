
import {TableDefinition, TableContext} from "./types-instrumentacion"

export function user_agents(context:TableContext):TableDefinition{
    var admin = context.user.rol === 'admin';
    return {
        name: 'user_agents',
        elementName: 'navegador conectado',
        editable: admin,
        fields: [
            { name: "ip"                 , typeName: 'text'    },
            { name: "user_agent"         , typeName: 'text'    },
            { name: "ips"                , typeName: 'text'    },
            { name: "momento"            , typeName: 'timestamp', defaultDbValue: 'current_timestamp'    },
        ],
        primaryKey: ['ip', 'user_agent'],
        foreignKeys: [
            {references:'ip'      , fields:['ip']               },
        ],
    }
}
