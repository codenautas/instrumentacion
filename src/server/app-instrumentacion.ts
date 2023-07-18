"use strict";

import * as backendPlus from "backend-plus";
import {defConfig} from "./def-config";
import {procedures} from "./procedures-instrumentacion";
import { AppBackend, ClientModuleDefinition, ExpressPlus, Request, Response } from "./types-instrumentacion";
export * from "./types-instrumentacion";

import { usuarios } from './table-usuarios';
import { ubicaciones } from './table-ubicaciones';
import { ip } from './table-ip';
import { user_agents } from './table-user_agents';
import { servidores } from './table-servidores';
import { databases } from './table-databases';
import { instapp } from './table-instapp';
import { operativos } from './table-operativos';
import { backups } from './table-backups';
import { motores } from './table-motores';
import { categorias_doc } from './table-categorias_doc';
import { aplicaciones } from './table-aplicaciones';
import { productos } from './table-productos';
import { areas } from './table-areas';
import { api_calls } from './table-api_calls';
import { ambientes } from './table-ambientes';
import * as MiniTools from "mini-tools";
import { unexpected } from 'cast-error';

import { html, HtmlTag } from 'js-to-html';
import { NextFunction } from "express";

export type Constructor<T> = new(...args: any[]) => T;
export function emergeAppInstrumentacion<T extends Constructor<AppBackend>>(Base:T){
    
    return class AppInstrumentacion extends Base{

        constructor(...args:any[]){ 
            super(args);    
        }

        clientIncludes(req:Request, opts:any):ClientModuleDefinition[]{
            return super.clientIncludes(req, opts).concat(
                req && req.user?[
                    {type:'js', src: 'client/instrumentacion.js' }
                ]:[]
            )
        }

        async getProcedures(){
            return (await super.getProcedures()).concat(procedures);
        }

        configStaticConfig(){
            super.configStaticConfig();
            this.setStaticConfig(defConfig);
        }

        commonPage(req:Request, content:HtmlTag<any>[], baseUrl:String/* , opts:{img?:string} */){
            //var logo = opts.img?.endsWith('.png') ? opts.img : 'img/logo-128.png';
            var lang = req.headers["accept-language"]?.match(/^\w\w/)?.[0];
            return html.html({lang}, [
                html.head([
                    html.link({rel:"stylesheet", href:`${baseUrl}/css/common-inst.css`}), 
                ]),
                html.body([ 
                    html.div({class: 'felx-conteiner'},[
                        html.div({class: 'flex-item caja-izq'}),
                        html.div({class: 'flex-item caja-cen'}, [
                            html.div({class:'contenido'},[
                                html.header({class:'header'},[
                                    html.h1(['Registro de instalación de la aplicación y del código fuente'])
                                ]),
                                html.div({class:'desarrollo-texto'},[
                                    content
                                ]),
                                html.footer({class:'footer'},[
                                    html.h4([
                                        html.img({class: 'svglog', src: `${baseUrl}/img/logest.svg`}),
                                        [' Dirección General de Estadistica y Censos | Proyectos Especiales Informaticos '],
                                        html.img({class: 'svglog', src: `${baseUrl}/img/logba.svg`}),
                                    ])
                                ])
                            ])
                            
                        ]),
                        html.div({class: 'flex-item caja-der'}),
                    ])
                ])
            ])
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
            });
            mainApp.get(baseUrl+`/documentacion/:operativo/:periodo`,async function(req:Request, res:Response, _next:NextFunction){
                try{
                    // var lang = req.headers["accept-language"]?.match(/^\w\w/)?.[0];
                    let documentQuery;
                    await be.inDbClient(req, async function(client){                        
                        documentQuery = client.query(`
                            select ia.instancia, ia.aplicacion, ia.ambiente, a.descripcion, 
                            ia.database, ia.base_url, ia.fecha_instalacion, a.git_host, a.git_group, 
                            a.git_project, ia.motor, ope.periodo, ia.operativo, 
                            from instapp ia 
                            inner join aplicaciones a on (a.aplicacion = ia.aplicacion)
                            inner join operativos ope on (ope.operativo = ia.operativo)
                            where ia.operativo = $1
                        `,[req.params.operativo]).fetchAll();
                        
                    });
                    const {rows:documentRow} = await documentQuery!;
                    const documentR = documentRow[0];

                    const mainContent = [
                        html.div([
                            html.b(['Identificación de instalación: ']),
                            [ documentR.instancia]
                        ]),
                        html.div([
                            html.b(['Ambiente de instalación: ']),
                            [ documentR.ambiente],                            
                            html.b(['Fecha de instalación: ']),
                            [ `${documentR.fecha_instalacion.toLocaleDateString()}`],
                            html.h2(['Aplicación']),
                            html.ul([
                                html.li([
                                    html.b(['Nombre de la aplicación: ']),
                                    [ documentR.aplicacion],
                                ]),
                                html.li([
                                    html.b(['Descripción de la aplicación: ']),
                                    [ documentR.descripcion],
                                ]),
                                html.li([
                                    html.b(['Repositorio: ']),
                                    [ `${documentR.git_host}/${documentR.git_group}/${documentR.git_project}`],
                                ]),
                            ]),
                            html.h2(['Características del sistema y del código fuente']),
                            html.ul([
                                html.li([
                                    html.b(['Motor: ']),
                                    [ documentR.motor],
                                ]),
                            ]),
                        ]),                                                   
                    ];
                    /* html.div([
                        html.h3(['Ambiente']),
                        documentRow.map(e=>{
                            return html.div([e.ambiente])
                        }),
                    ]), */
                    const htmlPage=be.commonPage(req, mainContent, baseUrl)
                    var txtPage = htmlPage.toHtmlDoc({title:'instrumentacion'},{})
                    MiniTools.serveText(txtPage,'html')(req,res);
                }catch(err){
                    console.error('ERROR CON', req.headers.host, req.url)
                    var error = unexpected(err)
                    error.code = error.code || '500';
                    error.message = req.params.nickname + ': ' + error.message;
                    MiniTools.serveErr(req, res, _next)(error);
                }
            });
        }

        getMenu():backendPlus.MenuDefinition{
            let myMenuPart:backendPlus.MenuInfo[]=[
                {menuType:'menu', name:'puestos', menuContent:[
                    {menuType:'table', name:'ip'},
                    {menuType:'table', name:'ubicaciones'},
                    {menuType:'table', name:'user_agents'},
                ]}, 
                {menuType:'menu', name:'servicios', menuContent:[
                    {menuType:'table', name:'ambientes'},
                    {menuType:'table', name:'aplicaciones'},
                    {menuType:'table', name:'areas'}
                    {menuType:'table', name:'backups'},
                    {menuType:'table', name:'databases'},
                    {menuType:'table', name:'instapp'},
                    {menuType:'table', name:'motores'},
                    {menuType:'table', name:'operativos'},
                    {menuType:'table', name:'productos'},
                    {menuType:'table', name:'servidores'},
                ]}, 
                {menuType:'menu', name:'provisorio', menuContent:[
                    {menuType:'proc', name:'api_call'},
                    {menuType:'table', name:'api_calls'},
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
                categorias_doc,
                ambientes,
                operativos,
                instapp,
                backups,
                motores,
                aplicaciones,
                productos,
                areas,
                api_calls
            }
        }
    }
}