"use strict";

const graphql = require('@octokit/graphql')
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
var procedures: ProcedureDef[] = [
    {
        action:'api_call',
        parameters:[
            {name:'token', typeName:'text'},
        ],
        coreFunction: async function(context: ProcedureContext, _parameters: CoreFunctionParameters){
            await context.client.query("SELECT * FROM api_calls WHERE when IS NULL").onRow(
                // @ts-ignore
                async function(row:{call:string}, _result){
                    await requestableP(https).request(row.call)
                    console.log('LISTO')
                }
            );
        }
    }
];
export {procedures};

