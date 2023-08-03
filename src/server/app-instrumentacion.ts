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
import { uso } from './table-uso';
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

        commonPage(req:Request, content:HtmlTag<any>[]){
            
            let baseUrl = `${this.app.path()}/client`;
            var lang = req.headers["accept-language"]?.match(/^\w\w/)?.[0];
            return html.html({lang}, [
                html.head([
                    html.link({rel:"stylesheet", href:`${baseUrl}/css/common-inst.css`}), 
                    html.link({rel:"stylesheet", href:`${baseUrl}/css/tipografia.css`}), 
                ]),
                html.body([ 
                    html.div({class: 'flex-conteiner'},[
                        html.div({class: 'flex-item caja-izq'}),
                        html.div({class: 'flex-item caja-cen'}, [
                            html.div({class:'contenido'},[
                                html.header({class:'header'},[
                                    html.h1(['F-ARIP-10 Registro código fuente'])
                                ]),
                                html.div({class:'desarrollo-texto'},[
                                    content
                                ]),
                                html.footer({class:'footer'},[
                                    html.h4([
                                        html.img({class: 'svglog', src: `${baseUrl}/img/logest.svg`}),
                                        [' Departamento de Proyectos Especiales '],
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
        
        groupBy = (objectArray:any, property:any)=>{
            return objectArray.reduce((acc:any, obj:any) => {
              const key = obj[property];
              const curGroup = acc[key] ?? [];
              return { ...acc, [key]: [...curGroup, obj] };
            }, {});
        }

        contentPage(documentRow:any){

            const documents = this.groupBy(documentRow,'operativo');
            
            let mainContent:HtmlTag<any>[] = [];
            const elementOperativo = (title:String, result:any, isDate:boolean =false)=>{
                if(!!result){
                    isDate && (result = result.toLocaleDateString());
                    return html.div([
                        html.b([title]),
                        [ `${result}`],
                    ]);
                }else{
                    return html.div()
                }
            }
            
            const elementDescripcion = (title:String, result:any)=>{
                if(!!result){
                    return html.div({class:'salto-linea'}, [
                        html.b([title]),
                        [ `${result}`],
                    ]);
                }else{
                    return html.div()
                }
            }

            const aplicaciones = (operativo:any)=>{
                const documentR = operativo[0];
                let url = '';
                const urlN = require('node:url');
                let arr = [];
                if(!!documentR.aplicacion){
                    arr.push(
                        html.li([
                            html.b(['Nombre de la aplicación: ']),
                            [ `${documentR.aplicacion}`],
                        ])
                    );
                }
                if(!!documentR.descripcion){
                    arr.push(
                        html.li({class:'salto-linea'}, [
                            html.b(['Descripción de la aplicación: ']),
                            [ documentR.descripcion],
                        ])
                    );
                }
                if(!!documentR.git_host){
                    url = documentR.git_host;
                } 
                if(!!documentR.git_group){
                    url = urlN.resolve(url,documentR.git_group);
                }
                if(!!documentR.git_project){
                    url = urlN.resolve(url,documentR.git_project);
                }
                if(!!url){
                    arr.push(html.li([
                        html.b(['Repositorio: ']),
                        html.a({href:`${url}`},`${url}`)
                    ])
                    );
                }
                if(arr.length>0){
                    return [html.h3(['Aplicaciones']),html.ul(arr)];
                }else{
                    return [];
                }
            }
            const caracteristicas = (operativo:any)=>{
                const documentR = operativo[0];
                let arr = [];
                (!!documentR.lenguaje) && arr.push(html.li([
                    html.b(['Lenguaje de programación: ']),
                    [ documentR.lenguaje],
                ]));
                
                (!!documentR.capac_ope) && arr.push(html.li([
                    html.b(['Capacidad operativa: ']),
                    [ documentR.capac_ope],
                ]));
                (!!documentR.tipo_db) && arr.push(html.li([
                    html.b(['Base de datos: ']),
                    [ documentR.tipo_db],
                ]));
                (!!documentR.tecnologias) && arr.push(html.li([
                    html.b(['Tecnologías: ']),
                    [ documentR.tecnologias],
                ]));
                if(arr.length>0){
                    return [
                        html.h3(['Características del sistema y del código fuente']),
                        html.ul(arr),
                    ];
                }else{
                    return [];
                }
            }

            const urls = (operativo:any)=>{
                
                const elementos = [
                    operativo.map((e:any)=>{
                        const arr = [];
                        let url:string = '';
                        const urlN = require('node:url');
                        if(!!e.ambiente){
                            arr.push(e.ambiente)
                        }
                        if(!!e.uso){
                            arr.push(', ')
                            arr.push(e.uso)
                        }
                        if(!!e.ser_base_url){
                            url = `${e.ser_base_url}`;
                        }
                        if(!!e.base_url){
                            url = urlN.resolve(url,e.base_url);
                        }
                        if(!!url){
                            arr.push(': ');
                            arr.push(html.a({href:`${url}`},`${url}`));
                        }
                        if(arr.length > 0){
                            const element = html.li(arr);
                            return (element);
                        }
                    }),
                ];
                if(elementos.length>0){
                    return [
                        html.h3(['Urls de Acceso']), 
                        html.ul(elementos)
                    ];
                }else{
                    return []
                }
            }

            Object.keys(documents).forEach(key => {
                const operativo = documents[key];
                const documentR = operativo[0];
                const operativoSortFecha = operativo.sort((a:any,b:any)=>a.amb_orden-b.amb_orden || a.fecha_instalacion-b.fecha_instalacion);
                const fechaInst = operativoSortFecha[0];
                const content:HtmlTag<any>[] = [
                    html.h2([
                        html.b(['Operativo: ']),
                        [ documentR.operativo],
                    ]),
                    elementOperativo('Pase a Producción: ', fechaInst.fecha_instalacion, true),
                    elementOperativo('Nombre del Operativo: ', documentR.ope_nom),
                    elementOperativo('Año del Operativo: ', documentR.ope_annio),
                    elementDescripcion('Descripción del Operativo: ', documentR.ope_desc),
                    elementOperativo('Onda del Operativo: ', documentR.ope_onda),
                    html.div([
                        aplicaciones(operativo),                                           
                        urls(operativo),
                        caracteristicas(operativo)
                    ]),                                                   
                ];
                mainContent = [...mainContent, ...content, html.br()]
            }); 
            return mainContent;
        }

        addLoggedServices():void{
            let be = this;
            super.addLoggedServices();
            be.app.get(`/documentacion`,async function(req:Request, res:Response, _next:NextFunction){
                try{
                    let documentQuery:any;
                    await be.inDbClient(req, async function(client){                        
                        documentQuery = client.query(`
                            select 
                            ia.operativo, ia.ambiente, ia.uso, ia.aplicacion, ia.base_url, ia.fecha_instalacion, ia.uso,
                            a.git_host, a.git_group, a.descripcion, a.git_project, a.lenguaje, a.capac_ope, a.tipo_db, a.tecnologias,
                            ope.nombre as ope_nom, ope.descripcion as ope_desc, ope.annio as ope_annio, ope.onda as ope_onda,
                            ser.base_url as ser_base_url,
                            u.orden as u_orden,
                            amb.orden as amb_orden
                            from instapp ia 
                            inner join operativos ope on (ope.operativo = ia.operativo)
                            left join aplicaciones a on (a.aplicacion = ia.aplicacion)
                            left join ambientes amb on (amb.ambiente = ia.ambiente)
                            left join servidores ser on (ser.servidor = ia. servidor)
                            left join uso u on (u.uso = ia.uso)
                            order by ope.operativo asc, amb.orden asc, u.orden asc, ia.instancia asc, ia.ambiente asc
                        `,[]).fetchAll();
                        
                    });
                    const {rows:documentRow} = await documentQuery!;
                    if(documentRow.length===0) throw new Error('No hay operativos');

                    const htmlPage=be.commonPage(req, be.contentPage(documentRow));
                    const txtPage = htmlPage.toHtmlDoc({title:'instrumentacion'},{})
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
                    {menuType:'table', name:'areas'},
                    {menuType:'table', name:'backups'},
                    {menuType:'table', name:'databases'},
                    {menuType:'table', name:'instapp'},
                    {menuType:'table', name:'motores'},
                    {menuType:'table', name:'operativos'},
                    {menuType:'table', name:'productos'},
                    {menuType:'table', name:'servidores'},
                    {menuType:'table', name:'uso'},
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
                uso,
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