"use strict";

import * as backendPlus from "backend-plus";
import {defConfig} from "./def-config";
import {procedures} from "./procedures-instrumentacion";
import { AppBackend, ClientModuleDefinition, ProcedureDef, ExpressPlus, Request, Response } from "./types-instrumentacion";
export * from "./types-instrumentacion";

import { usuarios } from './table-usuarios';
import { ubicaciones } from './table-ubicaciones';
import { ip } from './table-ip';
import { user_agents } from './table-user_agents';
import { servidores } from './table-servidores';
import { databases } from './table-databases';
import { instapp } from './table-instapp';
import { backups } from './table-backups';
import { motores } from './table-motores';
import { aplicaciones } from './table-aplicaciones';

import { html } from 'js-to-html';
import { NextFunction } from "express";

export type Constructor<T> = new(...args: any[]) => T;
export function emergeAppInstrumentacion<T extends Constructor<AppBackend>>(Base:T){
    
    return class AppInstrumentacion extends Base{
        myProcedures: ProcedureDef[] = procedures;

        constructor(...args:any[]){ 
            super(args);    
        }

        clientIncludes(req:Request|null, hideBEPlusInclusions?:boolean):ClientModuleDefinition[]{
            return super.clientIncludes(req, hideBEPlusInclusions).concat(
                req && req.user?[
                    {type:'js', src: 'client/instrumentacion.js' }
                ]:[]
            )
        }

        configStaticConfig(){
            super.configStaticConfig();
            this.setStaticConfig(defConfig);
        }

        addUnloggedServices(mainApp:ExpressPlus, baseUrl:string):void{
            var be=this;
            super.addUnloggedServices(mainApp, baseUrl);
            mainApp.get(baseUrl+'/ver', async function(req:Request, res:Response, _next:NextFunction){
                var attrs=[
                    'browser',
                    'version',
                    'os',
                    'platform',
                ]
                res.type('html');
                res.write(html.h1(['Datos del puesto de trabajo N° ',req.ip.split(/[:.]/).pop()]).toHtmlText({},{}));
                attrs.forEach(function(attr){
                    // @ts-ignore EL user agent para mostrar es un string!!!
                    var userAgentParaMostrar:string=(req.useragent?req.useragent[attr]:'') || '';
                    res.write(html.p([attr, ' ', html.b(userAgentParaMostrar)]).toHtmlText({},{}));
                })
                await be.inTransaction(req, async function(client){
                    var ipResult = await client.query('SELECT * FROM ip WHERE ip = $1',[req.ip]).fetchOneRowIfExists();
                    if(!ipResult.row){
                        await client.query('INSERT INTO ip (ip) VALUES ($1)',[req.ip]).execute();
                    }
                    var uaResult = await client.query('SELECT * FROM user_agents WHERE ip = $1 AND user_agent = $2',[req.ip, req.headers["user-agent"]]).fetchOneRowIfExists();
                    if(!uaResult.row){
                        await client.query('INSERT INTO user_agents (ip, user_agent) VALUES ($1, $2)',[req.ip, req.headers["user-agent"]]).execute();
                    }
                    console.log(req.headers);
                    res.write('<h2>ok</h2>');
                    await client.query('UPDATE user_agents SET ips = $3 WHERE ip = $1 AND user_agent = $2',[req.ip, req.headers["user-agent"], req.ips]).execute();
                }).catch(err=>res.end(html.pre(err.message).toHtmlText({},{})));
                res.end();
            })
        }

        getMenu():backendPlus.MenuDefinition{
            let myMenuPart:backendPlus.MenuInfo[]=[
                {menuType:'menu', name:'puestos', menuContent:[
                    {menuType:'table', name:'ubicaciones'},
                    {menuType:'table', name:'ip'},
                    {menuType:'table', name:'user_agents'},
                ]}, 
                {menuType:'menu', name:'servicios', menuContent:[
                    {menuType:'table', name:'servidores'},
                    {menuType:'table', name:'databases'},
                    {menuType:'table', name:'instapp'},
                    {menuType:'table', name:'backups'},
                    {menuType:'table', name:'motores'},
                    {menuType:'table', name:'aplicaciones'}
                ]}
            ];
            let menu = {menu: super.getMenu().menu.concat(myMenuPart)}
            return menu;
        }

        prepareGetTables(){
            super.prepareGetTables();
            this.getTableDefinition={
                ...this.getTableDefinition,
                usuarios,
                ubicaciones,
                ip,
                user_agents,
                servidores,
                databases,
                instapp,
                backups,
                motores,
                aplicaciones
            }
        }
    }
}