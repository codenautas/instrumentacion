"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion";

export function issues(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'issues',
        elementName:'issue',
        editable:admin,
        fields:[
            {name:'host'             , typeName:'text'    },
            {name:'group'            , typeName:'text'    },
            {name:'project'          , typeName:'text'    },
            {name:'issue'            , typeName:'text'    },
            {name:'state'            , typeName:'text'    },
            {name:'title'            , typeName:'text'    },
            {name:'body'             , typeName:'text'    },
            {name:'other_info'       , typeName:'jsonb'   },
        ],
        primaryKey:['host', 'group', 'project', 'issue'],
    };
}
