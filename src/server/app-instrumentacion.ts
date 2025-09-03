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
import { operativos_instancias } from './table-operativos_instancias';
import { repositorios_instancias } from './table-repositorios_instancias';
import { backups } from './table-backups';
import { backups_externos } from './table-backups_externos';
import { instancias_reporte_consultora } from './table-instancias_reporte_consultora';
import { servers_sin_dbs_ni_instancias_reporte_consultora } from './table-servers_sin_dbs_ni_instancias_reporte_consultora';
import { dbs_sin_instancia_reporte_consultora } from './table-dbs_sin_instancia_reporte_consultora';
import { motores_instalados } from './table-motores_instalados';
import { repositorios } from './table-repositorios';
import { productos } from './table-productos';
import { textos_doc } from './table-textos_doc';
import { areas } from './table-areas';
import { api_calls } from './table-api_calls';
import { ambientes } from './table-ambientes';
import * as MiniTools from "mini-tools";
import { unexpected } from 'cast-error';
import { html, HtmlTag } from 'js-to-html';
import { NextFunction } from "express";
import { databases_referentes_backups } from "./table-databases_referentes_backups";
import { emails } from "./table-emails";
import { versiones_base } from "./table-versiones_base";
import { versiones } from "./table-versiones";

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

        commonPage(req:Request, content:HtmlTag<any>[], documentText:any){
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
                                    html.h1([` ${documentText.encabezado} `])
                                ]),
                                html.div({class:'desarrollo-texto'},[
                                    content
                                ]),
                                html.footer({class:'footer'},[
                                    html.h4([
                                        html.img({class: 'svglog', src: `${baseUrl}/img/logest.svg`}),
                                        [` ${documentText.pie} `],
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

        convertDate(fecha:Date){
            const fechaBaseDato:Array<String> = fecha.toLocaleDateString('es-AR',{day:'numeric',month:'numeric',year:'numeric'}).split('/');
            const day:String = fechaBaseDato[0].padStart(2,'0');
            const month:String = fechaBaseDato[1].padStart(2,'0');
            const year:String = fechaBaseDato[2];
            return `${day}/${month}/${year}`;
        }

        contentPage(documentRow:any){

            const documents = this.groupBy(documentRow,'operativo');
            
            let mainContent:HtmlTag<any>[] = [];
            const elementOperativo = (title:String, result:any, isDate:boolean =false)=>{
                if(!!result){
                    isDate && (result = this.convertDate(result))
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

            const urlLimpia = (cadena:string = '') => {
                return cadena.replace(/^\/+|\/+$/g, '').trim();
            }

            const repositorios = (operativo:any)=>{
                const documentR = operativo[0];
                let url = '';
                let arr = [];
                if(!!documentR.repositorio){
                    arr.push(
                        html.li([
                            html.b(['Nombre del repositorio: ']),
                            [ `${documentR.repositorio}`],
                        ])
                    );
                }
                if(!!documentR.descripcion){
                    arr.push(
                        html.li({class:'salto-linea'}, [
                            html.b(['Descripción del repositorio: ']),
                            [ documentR.descripcion],
                        ])
                    );
                }
                if(!!documentR.git_host){
                    url = urlLimpia(documentR.git_host);
                } 
                if(!!documentR.git_group){
                    url = `${url}/${urlLimpia(documentR.git_group)}`;
                }
                if(!!documentR.git_project){
                    url = `${url}/${urlLimpia(documentR.git_project)}`;
                }
                if(!!url){
                    arr.push(html.li([
                        html.b(['Repositorio: ']),
                        html.a({href:`${url}`},`${url}`)
                    ])
                    );
                }
                if(arr.length>0){
                    return [html.h3(['repositorios']),html.ul(arr)];
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
                        if(!!e.ambiente){
                            arr.push(e.ambiente)
                        }
                        if(!!e.uso){
                            arr.push(', ')
                            arr.push(e.uso)
                        }
                        if(!!e.ser_base_url){
                            url = urlLimpia(e.ser_base_url);
                        }
                        if(!!e.base_url){
                            url = `${url}/${urlLimpia(e.base_url)}`;
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
                    html.div({class:'blockquote'},[

                        html.div({class: 'salto-pagina'},[
                            html.h2([
                                html.b(['Operativo: ']),
                                [ documentR.operativo],
                            ]),
                            elementOperativo('Pase a Producción: ', fechaInst.fecha_instalacion, true),
                            elementOperativo('Nombre del Operativo: ', documentR.ope_nom),
                            elementOperativo('Año del Operativo: ', documentR.ope_annio),
                            elementDescripcion('Descripción del Operativo: ', documentR.ope_desc),
                            elementOperativo('Onda del Operativo: ', documentR.ope_onda),
                        ]),
                        html.div({class: 'salto-pagina'},[
                            repositorios(operativo),                                           
                        ]),
                        html.div({class: 'salto-pagina'},[
                            urls(operativo),
                        ]),
                        html.div({class: 'salto-pagina'},[
                            caracteristicas(operativo)
                        ]),
                    ]),
                ];
                mainContent = [...mainContent, ...content]
            }); 
            return mainContent;
        }

        addLoggedServices():void{
            let be = this;
            super.addLoggedServices();
            be.app.get(`/documentacion`,async function(req:Request, res:Response, _next:NextFunction){
                try{
                    let documentQuery:any;
                    let documentTextQuery:any;
                    await be.inDbClient(req, async function(client){                        
                        documentQuery = client.query(`
                            select 
                            ia.operativo, ia.ambiente, ia.uso, ia.repositorio, ia.base_url, ia.fecha_instalacion, ia.uso,
                            a.git_host, a.git_group, a.descripcion, a.git_project, a.lenguaje, a.capac_ope, a.tipo_db, a.tecnologias,
                            ope.nombre as ope_nom, ope.descripcion as ope_desc, ope.annio as ope_annio, ope.onda as ope_onda,
                            ser.base_url as ser_base_url,
                            u.orden as u_orden,
                            amb.orden as amb_orden
                            from instapp ia 
                            inner join operativos ope on (ope.operativo = ia.operativo)
                            left join repositorios a on (a.repositorio = ia.repositorio)
                            left join ambientes amb on (amb.ambiente = ia.ambiente)
                            left join servidores ser on (ser.servidor = ia. servidor)
                            left join uso u on (u.uso = ia.uso)
                            order by ope.operativo asc, amb.orden asc, u.orden asc, ia.instancia asc, ia.ambiente asc
                        `,[]).fetchAll();
                        documentTextQuery = client.query(`
                            select *
                            from textos_doc
                        `,[]).fetchAll();
                    });
                    const {rows:documentRow} = await documentQuery!;
                    const {rows:documentTextRow} = await documentTextQuery!;
                    if(documentRow.length===0) throw new Error('No hay operativos');
                    let docText = {
                        encabezado: '',
                        pie: '',
                        archivo: 'Registro código fuente'
                    }
                    documentTextRow.forEach((element:any) => {
                        if(element.codigo === 'nombre_de_archivo' && !!element.texto){
                            docText.archivo = element.texto;
                        }
                        if(element.codigo === 'pie' && !!element.texto){
                            docText.pie = element.texto;
                        }
                        if(element.codigo === 'encabezado' && !!element.texto){
                            docText.encabezado = element.texto;
                        }
                    });
                    const htmlPage=be.commonPage(req, be.contentPage(documentRow), docText);
                    const txtPage = htmlPage.toHtmlDoc({title:`${docText.archivo}`},{})
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
                    {menuType:'table', name:'usuarios'},
                ]}, 
                {menuType:'menu', name:'servicios', menuContent:[
                    {menuType:'table', name:'instapp'},
                    {menuType:'table', name:'databases'},
                    {menuType:'table', name:'servidores'},
                    {menuType:'table', name:'repositorios'},
                    {menuType:'table', name:'operativos'},
                    {menuType:'table', name:'areas'},
                    {menuType:'table', name:'ambientes'},
                    {menuType:'table', name:'textos_doc'},
                    {menuType:'table', name:'emails'},
                    {menuType:'table', name:'uso'},
                ]}, 
                {menuType:'menu', name:'software_terceros', menuContent:[
                    {menuType:'table', name:'productos'},
                    {menuType:'table', name:'versiones_base'},
                    {menuType:'table', name:'versiones'},
                    {menuType:'table', name:'motores_instalados'},
                ]}, 
                {menuType:'menu', name:'backups', menuContent:[
                    {menuType:'table', name:'backups_externos', label:'registro backups'},
                    {menuType:'proc', name:'show_databases_referentes_backups', label:'referente backup por DB', autoproced:true},
                    {menuType:'table', name:'backups', label:'backups en server con crontab'},
                ]},
                {menuType:'menu', name:'provisorio', menuContent:[
                    {menuType:'proc', name:'api_call'},
                    {menuType:'table', name:'api_calls'},
                ]},
                {menuType:'menu', name:'reportes_consultora', menuContent:[
                    {menuType:'table', name:'instancias_reporte_consultora', label:'instancias'},
                    {menuType:'table', name:'dbs_sin_instancia_reporte_consultora', label:'dbs_sin_instancia'},
                    {menuType:'table', name:'servers_sin_dbs_ni_instancias_reporte_consultora', label:'servers_sin_dbs_ni_instancias'},
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
                textos_doc,
                ubicaciones,
                ip,
                user_agents,
                servidores,
                databases,
                databases_referentes_backups,
                ambientes,
                operativos,
                operativos_instancias,
                repositorios_instancias,
                uso,
                instapp,
                backups,
                backups_externos,
                instancias_reporte_consultora,
                servers_sin_dbs_ni_instancias_reporte_consultora,
                dbs_sin_instancia_reporte_consultora,
                versiones_base,
                versiones,
                motores_instalados,
                repositorios,
                productos,
                emails,
                areas,
                api_calls
            }
        }
    }
}