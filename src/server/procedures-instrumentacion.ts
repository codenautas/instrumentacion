"use strict";

import * as http from "http";
import * as https from "https";
import { RequestOptions } from "https";
import { URL } from "url";

interface IWithRequest{
    request:(options: RequestOptions | string | URL, callback?: (res: http.IncomingMessage) => void) => http.ClientRequest;
}

function requestableP(object:IWithRequest):{
    request:(options:  RequestOptions | string | URL) => Promise<string>
}{
    return {
        request:async function(options){
            return new Promise(function(resolve, reject){
                var req = object.request(options, function(res){
                    res.on('data', function(chunk){
                        console.log('data1', chunk)
                        console.log('data2', chunk.toString());
                    })
                    res.on('end', function(x:string){
                        console.log('end', x)
                        console.log('res',res);
                        resolve('')
                    })
                });
                req.on('error', reject);
                req.end();
            });
        }
    };
}

import { ProcedureDef, ProcedureContext, CoreFunctionParameters } from "backend-plus";
import { ParametrosRegistro, opcionesRegistro, previsualizarYaml, registrarInstancia, yamlDeInstancia } from "./registrar-instancia";
var procedures: ProcedureDef[] = [
    {
        action:'api_call',
        parameters:[
            {name:'token', typeName:'text'},
        ],
        coreFunction: async function(context: ProcedureContext, _parameters: CoreFunctionParameters<{token:string}>){
            await context.client.query('SELECT * FROM api_calls WHERE "when" IS NULL').onRow(
                async function(row:Record<string, unknown>){
                    await requestableP(https).request(String(row.call))
                    console.log('LISTO')
                }
            );
        }
    },
    {
        action: 'instancia_registrar',
        parameters:[
            {name:'instancia'        , typeName:'text', label:'instancia'},
            {name:'ambiente'         , typeName:'text', references:'ambientes'},
            {name:'servidor'         , typeName:'text', references:'servidores'},
            {name:'operativo'        , typeName:'text', description:'si no existe se crea'},
            {name:'nombre_operativo' , typeName:'text', description:'sólo se usa si el operativo no existe'},
            {name:'descripcion_operativo' , typeName:'text', description:'sólo se usa si el operativo no existe'},
            {name:'annio_operativo'  , typeName:'integer', description:'sólo se usa si el operativo no existe'},
            {name:'onda_operativo'   , typeName:'text', description:'sólo se usa si el operativo no existe'},
            {name:'repositorio'      , typeName:'text', references:'repositorios'},
            {name:'uso'              , typeName:'text', references:'uso'},
            {name:'base_url'         , typeName:'text'},
            {name:'policy'           , typeName:'text', description:'ej. web para las instancias dm'},
            {name:'success_redirect' , typeName:'text', description:'ej. /campo para las instancias dm'},
            {name:'database'         , typeName:'text', description:'por defecto el nombre de la instancia; si no existe se crea'},
            {name:'db_servidor'      , typeName:'text', references:'servidores', description:'por defecto el mismo servidor'},
            {name:'db_port'          , typeName:'integer', description:'por defecto el más usado en el servidor de la base'},
            {name:'db_owner'         , typeName:'text'},
            {name:'db_user'          , typeName:'text'},
            {name:'criticidad'       , typeName:'text'},
            {name:'tolerancia_downtime', typeName:'text'},
            {name:'so_user'          , typeName:'text'},
            {name:'db_schema'        , typeName:'text'},
            {name:'db_periodo'       , typeName:'text'},
            {name:'db_area'          , typeName:'text'},
            {name:'db_estado'        , typeName:'text'},
            {name:'db_en_campo'      , typeName:'boolean'},
            {name:'db_seg_confidencialidad', typeName:'integer'},
            {name:'db_seg_integridad', typeName:'integer'},
            {name:'db_seg_disponibilidad', typeName:'integer'},
        ],
        roles:['admin'],
        coreFunction: async function(context: ProcedureContext, parameters: CoreFunctionParameters<ParametrosRegistro>){
            return await registrarInstancia(context.client, parameters);
        }
    },
    {
        action: 'instancia_yaml_ver',
        parameters:[
            {name:'instancia' , typeName:'text'},
            {name:'ambiente'  , typeName:'text'},
        ],
        roles:['admin'],
        coreFunction: async function(context: ProcedureContext, parameters: CoreFunctionParameters<{instancia:string, ambiente:string}>){
            return await yamlDeInstancia(context.client, parameters.instancia, parameters.ambiente);
        }
    },
    {
        action: 'instancia_registrar_opciones',
        parameters:[],
        roles:['admin'],
        coreFunction: async function(context: ProcedureContext, _parameters: CoreFunctionParameters<{}>){
            return await opcionesRegistro(context.client);
        }
    },
    {
        action: 'instancia_registrar_yaml',
        parameters:[
            {name:'instancia'        , typeName:'text'},
            {name:'ambiente'         , typeName:'text'},
            {name:'servidor'         , typeName:'text'},
            {name:'puerto'           , typeName:'integer'},
            {name:'repositorio'      , typeName:'text'},
            {name:'base_url'         , typeName:'text'},
            {name:'policy'           , typeName:'text'},
            {name:'success_redirect' , typeName:'text'},
            {name:'database'         , typeName:'text'},
            {name:'db_servidor'      , typeName:'text'},
            {name:'db_port'          , typeName:'integer'},
            {name:'db_owner'         , typeName:'text'},
            {name:'db_user'          , typeName:'text'},
            {name:'criticidad'       , typeName:'text'},
            {name:'tolerancia_downtime', typeName:'text'},
            {name:'so_user'          , typeName:'text'},
            {name:'db_schema'        , typeName:'text'},
            {name:'db_periodo'       , typeName:'text'},
            {name:'db_area'          , typeName:'text'},
            {name:'db_estado'        , typeName:'text'},
            {name:'db_en_campo'      , typeName:'boolean'},
            {name:'db_seg_confidencialidad', typeName:'integer'},
            {name:'db_seg_integridad', typeName:'integer'},
            {name:'db_seg_disponibilidad', typeName:'integer'},
        ],
        roles:['admin'],
        coreFunction: async function(context: ProcedureContext, parameters: CoreFunctionParameters<ParametrosRegistro>){
            return await previsualizarYaml(context.client, parameters);
        }
    },
    {
        action: 'show_databases_referentes_backups',
        parameters:[],
        resultOk:'showGrid',
        coreFunction:async function(_context:ProcedureContext, _params:CoreFunctionParameters<{}>){
            return {tableName:'databases_referentes_backups'};
        }
    }
];
export {procedures};

