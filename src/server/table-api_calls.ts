"use strict";

import {TableDefinition, TableContext} from "./types-instrumentacion";

export function api_calls(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'api_calls',
        elementName:'API call',
        editable:admin,
        fields:[
            {name:'source_host'      , typeName:'text'    },
            {name:'request_num'      , typeName:'text'    },
            {name:'api'              , typeName:'text'    },
            {name:'call'             , typeName:'text'    },
            {name:'call_parameters'  , typeName:'jsonb'   },
            {name:'when'             , typeName:'interval'},
            {name:'response_code'    , typeName:'text'    },
            {name:'response_headers' , typeName:'text'    },
            {name:'response_body'    , typeName:'text'    },
            {name:'response_time'    , typeName:'text'    },
        ],
        primaryKey:['source_host', 'request_num'],
    };
}
