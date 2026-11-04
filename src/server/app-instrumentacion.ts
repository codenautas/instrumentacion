"use strict";

import * as backendPlus from "backend-plus";
import { defConfig } from "./def-config";
import { procedures } from "./procedures-instrumentacion";
import { AppBackend, ClientModuleDefinition, ExpressPlus, OptsClientPage, Request, Response } from "./types-instrumentacion";
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
import { servidores_versiones } from './table-servidores_versiones';
import { repositorios } from './table-repositorios';
import { productos } from './table-productos';
import { textos_doc } from './table-textos_doc';
import { areas } from './table-areas';
import { api_calls } from './table-api_calls';
import { ambientes } from './table-ambientes';
import * as MiniTools from "mini-tools";
import { unexpected } from 'cast-error';
import { html, Html } from 'js-to-html';
import { NextFunction } from "express";
import type { AgentDetails } from "express-useragent";
import { databases_referentes_backups } from "./table-databases_referentes_backups";
import { emails } from "./table-emails";
import { versiones_base } from "./table-versiones_base";
import { versiones } from "./table-versiones";
import { instapps_productos } from "./table-instapps_productos";
import { armarYamlConfig, datosConfig } from "./registrar-instancia";

// TypeScript exige `any[]` en el constructor de un mixin (error TS2545 con cualquier otro tipo)
export type Constructor<T> = new (...args: any[]) => T;

type FilaDocumentacion = {
  operativo: string, ambiente: string | null, uso: string | null, repositorio: string | null, base_url: string | null, fecha_instalacion: Date | null,
  git_host: string | null, git_group: string | null, descripcion: string | null, git_project: string | null,
  lenguaje: string | null, capac_ope: string | null, tipo_db: string | null, tecnologias: string | null,
  ope_nom: string | null, ope_desc: string | null, ope_annio: number | null, ope_onda: string | null,
  ser_base_url: string | null, u_orden: number | null, amb_orden: number | null
}
type TextoDoc = { codigo: string, texto: string | null }
type TextosDocumentacion = { encabezado: string, pie: string, archivo: string }

// pg-promise-strict entrega las filas sin tipar: acá se convierten a tipos explícitos, campo por campo
type FilaSinTipar = Record<string, unknown>
function texto(valor: unknown): string | null {
  return valor == null ? null : String(valor);
}
function numero(valor: unknown): number | null {
  return valor == null ? null : Number(valor);
}
function fecha(valor: unknown): Date | null {
  return valor == null ? null : valor instanceof Date ? valor : new Date(String(valor));
}
function filaDocumentacion(row: FilaSinTipar): FilaDocumentacion {
  return {
    operativo: String(row.operativo), ambiente: texto(row.ambiente), uso: texto(row.uso), repositorio: texto(row.repositorio), base_url: texto(row.base_url), fecha_instalacion: fecha(row.fecha_instalacion),
    git_host: texto(row.git_host), git_group: texto(row.git_group), descripcion: texto(row.descripcion), git_project: texto(row.git_project),
    lenguaje: texto(row.lenguaje), capac_ope: texto(row.capac_ope), tipo_db: texto(row.tipo_db), tecnologias: texto(row.tecnologias),
    ope_nom: texto(row.ope_nom), ope_desc: texto(row.ope_desc), ope_annio: numero(row.ope_annio), ope_onda: texto(row.ope_onda),
    ser_base_url: texto(row.ser_base_url), u_orden: numero(row.u_orden), amb_orden: numero(row.amb_orden)
  };
}
function textoDoc(row: FilaSinTipar): TextoDoc {
  return { codigo: String(row.codigo), texto: texto(row.texto) };
}
export function emergeAppInstrumentacion<T extends Constructor<AppBackend>>(Base: T) {

  return class AppInstrumentacion extends Base {

    constructor(...args: any[]) {
      super(...args);
    }

    clientIncludes(req: Request, opts?: OptsClientPage): ClientModuleDefinition[] {
      var logueado = !!(req && req.user);
      // se incluyen siempre (no sólo logueado): backend-plus monta los archivos de lib/ al arrancar, sin usuario
      var reactYMui: ClientModuleDefinition[] = [
        { type: 'js', module: 'react', modPath: 'umd', fileDevelopment: 'react.development.js', file: 'react.production.min.js' },
        { type: 'js', module: 'react-dom', modPath: 'umd', fileDevelopment: 'react-dom.development.js', file: 'react-dom.production.min.js' },
        { type: 'js', module: '@mui/material', modPath: '../umd', fileDevelopment: 'material-ui.development.js', file: 'material-ui.production.min.js' },
      ];
      return reactYMui.concat(super.clientIncludes(req, opts)).concat(
        logueado ? [
          { type: 'js', src: 'client/instrumentacion.js' },
          { type: 'js', src: 'client/ws-registrar-instancia.js' },
          { type: 'js', src: 'client/ws-yaml-instancia.js' }
        ] : []
      )
    }

    async getProcedures() {
      return (await super.getProcedures()).concat(procedures);
    }

    configStaticConfig() {
      super.configStaticConfig();
      this.setStaticConfig(defConfig);
    }

    commonPage(req: Request, content: Html[], documentText: TextosDocumentacion) {
      let baseUrl = `${this.app.path()}/client`;
      var lang = req.headers["accept-language"]?.match(/^\w\w/)?.[0];

      return html.html({ lang }, [
        html.head([
          html.link({ rel: "stylesheet", href: `${baseUrl}/css/common-inst.css` }),
          html.link({ rel: "stylesheet", href: `${baseUrl}/css/tipografia.css` }),
        ]),
        html.body([
          html.div({ class: 'flex-conteiner' }, [
            html.div({ class: 'flex-item caja-izq' }),
            html.div({ class: 'flex-item caja-cen' }, [
              html.div({ class: 'contenido' }, [
                html.header({ class: 'header' }, [
                  html.h1([` ${documentText.encabezado} `])
                ]),
                html.div({ class: 'desarrollo-texto' }, [
                  content
                ]),
                html.footer({ class: 'footer' }, [
                  html.h4([
                    html.img({ class: 'svglog', src: `${baseUrl}/img/logest.svg` }),
                    [` ${documentText.pie} `],
                    html.img({ class: 'svglog', src: `${baseUrl}/img/logba.svg` }),
                  ])
                ])
              ])

            ]),
            html.div({ class: 'flex-item caja-der' }),
          ])
        ])
      ])
    }

    groupBy<T, K extends keyof T>(objectArray: T[], property: K) {
      return objectArray.reduce((acc: Record<string, T[]>, obj: T) => {
        const key = String(obj[property]);
        const curGroup = acc[key] ?? [];
        return { ...acc, [key]: [...curGroup, obj] };
      }, {});
    }

    convertDate(fecha: Date) {
      const fechaBaseDato: Array<String> = fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric', year: 'numeric' }).split('/');
      const day: String = fechaBaseDato[0].padStart(2, '0');
      const month: String = fechaBaseDato[1].padStart(2, '0');
      const year: String = fechaBaseDato[2];
      return `${day}/${month}/${year}`;
    }

    contentPage(documentRow: FilaDocumentacion[]) {

      const documents = this.groupBy(documentRow, 'operativo');

      let mainContent: Html[] = [];
      const elementOperativo = (title: String, result: string | number | Date | null, isDate: boolean = false) => {
        if (!!result) {
          isDate && result instanceof Date && (result = this.convertDate(result))
          return html.div([
            html.b([title]),
            [`${result}`],
          ]);
        } else {
          return html.div()
        }
      }

      const elementDescripcion = (title: String, result: string | null) => {
        if (!!result) {
          return html.div({ class: 'salto-linea' }, [
            html.b([title]),
            [`${result}`],
          ]);
        } else {
          return html.div()
        }
      }

      const urlLimpia = (cadena: string = '') => {
        return cadena.replace(/^\/+|\/+$/g, '').trim();
      }

      const repositorios = (operativo: FilaDocumentacion[]) => {
        const documentR = operativo[0];
        let url = '';
        let arr = [];
        if (!!documentR.repositorio) {
          arr.push(
            html.li([
              html.b(['Nombre del repositorio: ']),
              [`${documentR.repositorio}`],
            ])
          );
        }
        if (!!documentR.descripcion) {
          arr.push(
            html.li({ class: 'salto-linea' }, [
              html.b(['Descripción del repositorio: ']),
              [documentR.descripcion],
            ])
          );
        }
        if (!!documentR.git_host) {
          url = urlLimpia(documentR.git_host);
        }
        if (!!documentR.git_group) {
          url = `${url}/${urlLimpia(documentR.git_group)}`;
        }
        if (!!documentR.git_project) {
          url = `${url}/${urlLimpia(documentR.git_project)}`;
        }
        if (!!url) {
          arr.push(html.li([
            html.b(['Repositorio: ']),
            html.a({ href: `${url}` }, `${url}`)
          ])
          );
        }
        if (arr.length > 0) {
          return [html.h3(['repositorios']), html.ul(arr)];
        } else {
          return [];
        }
      }
      const caracteristicas = (operativo: FilaDocumentacion[]) => {
        const documentR = operativo[0];
        let arr = [];
        (!!documentR.lenguaje) && arr.push(html.li([
          html.b(['Lenguaje de programación: ']),
          [documentR.lenguaje],
        ]));

        (!!documentR.capac_ope) && arr.push(html.li([
          html.b(['Capacidad operativa: ']),
          [documentR.capac_ope],
        ]));
        (!!documentR.tipo_db) && arr.push(html.li([
          html.b(['Base de datos: ']),
          [documentR.tipo_db],
        ]));
        (!!documentR.tecnologias) && arr.push(html.li([
          html.b(['Tecnologías: ']),
          [documentR.tecnologias],
        ]));
        if (arr.length > 0) {
          return [
            html.h3(['Características del sistema y del código fuente']),
            html.ul(arr),
          ];
        } else {
          return [];
        }
      }

      const urls = (operativo: FilaDocumentacion[]) => {

        const elementos = (
          operativo.map((e: FilaDocumentacion) => {
            const arr = [];
            let url: string = '';
            if (!!e.ambiente) {
              arr.push(e.ambiente)
            }
            if (!!e.uso) {
              arr.push(', ')
              arr.push(e.uso)
            }
            if (!!e.ser_base_url) {
              url = urlLimpia(e.ser_base_url);
            }
            if (!!e.base_url) {
              url = `${url}/${urlLimpia(e.base_url)}`;
            }
            if (!!url) {
              arr.push(': ');
              arr.push(html.a({ href: `${url}` }, `${url}`));
            }
            if (arr.length > 0) {
              const element = html.li(arr);
              return (element);
            } else {
              return null
            }
          }).filter((e: Html | null) => !!e)
        );
        if (elementos.length > 0) {
          return [
            html.h3(['Urls de Acceso']),
            html.ul(elementos)
          ];
        } else {
          return []
        }
      }

      Object.keys(documents).forEach(key => {
        const operativo = documents[key];
        const documentR = operativo[0];
        const operativoSortFecha = operativo.sort((a, b) => (a.amb_orden ?? 0) - (b.amb_orden ?? 0) || Number(a.fecha_instalacion) - Number(b.fecha_instalacion));
        const fechaInst = operativoSortFecha[0];
        const content: Html[] = [
          html.div({ class: 'blockquote' }, [

            html.div({ class: 'salto-pagina' }, [
              html.h2([
                html.b(['Operativo: ']),
                [documentR.operativo],
              ]),
              elementOperativo('Pase a Producción: ', fechaInst.fecha_instalacion, true),
              elementOperativo('Nombre del Operativo: ', documentR.ope_nom),
              elementOperativo('Año del Operativo: ', documentR.ope_annio),
              elementDescripcion('Descripción del Operativo: ', documentR.ope_desc),
              elementOperativo('Onda del Operativo: ', documentR.ope_onda),
            ]),
            html.div({ class: 'salto-pagina' }, [
              repositorios(operativo),
            ]),
            html.div({ class: 'salto-pagina' }, [
              urls(operativo),
            ]),
            html.div({ class: 'salto-pagina' }, [
              caracteristicas(operativo)
            ]),
          ]),
        ];
        mainContent = [...mainContent, ...content]
      });
      return mainContent;
    }

    addLoggedServices(): void {
      let be = this;
      super.addLoggedServices();
      be.app.get(`/documentacion`, async function (req: Request, res: Response, _next: NextFunction) {
        try {
          let documentRow: FilaDocumentacion[] = [];
          let documentTextRow: TextoDoc[] = [];
          await be.inDbClient(req, async function (client) {
            documentRow = (await client.query(`
              select
                ia.operativo, ia.ambiente, ia.uso, ia.repositorio, ia.base_url, ia.fecha_instalacion,
                a.git_host, a.git_group, a.descripcion, a.git_project, a.lenguaje, a.capac_ope, a.tipo_db, a.tecnologias,
                ope.nombre as ope_nom, ope.descripcion as ope_desc, ope.annio as ope_annio, ope.onda as ope_onda,
                ser.base_url as ser_base_url,
                u.orden as u_orden,
                amb.orden as amb_orden
                from instapp ia
                inner join operativos ope on (ope.operativo = ia.operativo)
                left join repositorios a on (a.repositorio = ia.repositorio)
                left join ambientes amb on (amb.ambiente = ia.ambiente)
                left join servidores ser on (ser.servidor = ia.servidor)
                left join uso u on (u.uso = ia.uso)
                order by ope.operativo asc, amb.orden asc, u.orden asc, ia.instancia asc, ia.ambiente asc
              `, []).fetchAll()).rows.map(filaDocumentacion);
            documentTextRow = (await client.query(`
              select *
                from textos_doc
              `, []).fetchAll()).rows.map(textoDoc);
          });
          if (documentRow.length === 0) throw new Error('No hay operativos');
          let docText: TextosDocumentacion = {
            encabezado: '',
            pie: '',
            archivo: 'Registro código fuente'
          }
          documentTextRow.forEach((element) => {
            if (element.codigo === 'nombre_de_archivo' && !!element.texto) {
              docText.archivo = element.texto;
            }
            if (element.codigo === 'pie' && !!element.texto) {
              docText.pie = element.texto;
            }
            if (element.codigo === 'encabezado' && !!element.texto) {
              docText.encabezado = element.texto;
            }
          });
          const htmlPage = be.commonPage(req, be.contentPage(documentRow), docText);
          const txtPage = htmlPage.toHtmlDoc({ title: `${docText.archivo}` }, {})
          MiniTools.serveText(txtPage, 'html')(req, res);
        } catch (err) {
          console.error('ERROR CON', req.headers.host, req.url)
          var error = unexpected(err)
          error.code = error.code || '500';
          error.message = 'documentacion: ' + error.message;
          MiniTools.serveErr(req, res, _next)(error);
        }
      });

    }

    addUnloggedServices(mainApp: ExpressPlus, baseUrl: string): void {
      var be = this;

      super.addUnloggedServices(mainApp, baseUrl);

      // Devuelve el local-config.yaml de una instancia. Sólo si está definido instrumentacion.config-token
      // en el local-config.yaml y llega igual en el header x-token (o ?token=), p.ej.:
      //   curl -H "x-token: $T" http://host/instrumentacion/config/etoi271 > /opt/insts/etoi271.yaml
      mainApp.get(baseUrl + '/config/:instancia{/:ambiente}', async function (req: Request, res: Response, _next: NextFunction) {
        var tokenEsperado = be.config.instrumentacion?.["config-token"];
        var tokenRecibido = req.headers['x-token'] ?? req.query.token;
        if (!tokenEsperado) {
          res.status(404).type('text').end('config no habilitado');
          return;
        }
        if (tokenRecibido !== tokenEsperado) {
          res.status(403).type('text').end('token inválido');
          return;
        }
        try {
          var instancia = String(req.params.instancia);
          var ambiente = req.params.ambiente == null ? null : String(req.params.ambiente);
          var datos = await be.inDbClient(req, client => datosConfig(client, instancia, ambiente));
          if (datos.length === 0) {
            res.status(404).type('text').end(`no existe la instancia ${instancia}`);
          } else if (datos.length > 1) {
            res.status(409).type('text').end(`la instancia ${instancia} está en varios ambientes (${datos.map(d => d.ambiente).join(', ')}); usar /config/${instancia}/<ambiente>`);
          } else {
            res.type('text/yaml').end(armarYamlConfig(datos[0]));
          }
        } catch (err) {
          res.status(500).type('text').end(unexpected(err).message);
        }
      });

      mainApp.get(baseUrl + '/ver', async function (req: Request, res: Response, _next: NextFunction) {
        var attrs: (keyof Pick<AgentDetails, 'browser' | 'version' | 'os' | 'platform'>)[] = [
          'browser',
          'version',
          'os',
          'platform',
        ]
        res.type('html');
        res.write(html.h1(['Datos del puesto de trabajo N° ', req.ip?.split(/[:.]/).pop() ?? '']).toHtmlText({}, {}));
        attrs.forEach(function (attr) {
          var userAgentParaMostrar: string = String((req.useragent ? req.useragent[attr] : '') || '');
          res.write(html.p([attr, ' ', html.b(userAgentParaMostrar)]).toHtmlText({}, {}));
        })
        await be.inTransaction(req, async function (client) {
          var ipResult = await client.query('SELECT * FROM ip WHERE ip = $1', [req.ip]).fetchOneRowIfExists();
          if (!ipResult.row) {
            await client.query('INSERT INTO ip (ip) VALUES ($1)', [req.ip]).execute();
          }
          var uaResult = await client.query('SELECT * FROM user_agents WHERE ip = $1 AND user_agent = $2', [req.ip, req.headers["user-agent"]]).fetchOneRowIfExists();
          if (!uaResult.row) {
            await client.query('INSERT INTO user_agents (ip, user_agent) VALUES ($1, $2)', [req.ip, req.headers["user-agent"]]).execute();
          }
          console.log(req.headers);
          await client.query('UPDATE user_agents SET ips = $3 WHERE ip = $1 AND user_agent = $2', [req.ip, req.headers["user-agent"], req.ips]).execute();
        }).then(
          () => res.end('<h2>ok</h2>'),
          err => res.end(html.pre(unexpected(err).message).toHtmlText({}, {}))
        );
      });

    }

    getMenu(): backendPlus.MenuDefinition {
      let myMenuPart: backendPlus.MenuInfo[] = [
        {
          menuType: 'menu', name: 'puestos', menuContent: [
            { menuType: 'table', name: 'ip' },
            { menuType: 'table', name: 'ubicaciones' },
            { menuType: 'table', name: 'user_agents' },
            { menuType: 'table', name: 'usuarios' },
          ]
        },
        {
          menuType: 'menu', name: 'servicios', menuContent: [
            { menuType: 'instancia_registrar', name: 'instancia_registrar', label: 'registrar instancia' },
            { menuType: 'table', name: 'instapp' },
            { menuType: 'table', name: 'databases' },
            { menuType: 'table', name: 'servidores' },
            { menuType: 'table', name: 'repositorios' },
            { menuType: 'table', name: 'operativos' },
            { menuType: 'table', name: 'areas' },
            { menuType: 'table', name: 'ambientes' },
            { menuType: 'table', name: 'textos_doc' },
            { menuType: 'table', name: 'emails' },
            { menuType: 'table', name: 'uso' },
          ]
        },
        {
          menuType: 'menu', name: 'software_terceros', menuContent: [
            { menuType: 'table', name: 'productos' },
            { menuType: 'table', name: 'versiones_base' },
            { menuType: 'table', name: 'versiones' },
            { menuType: 'table', name: 'servidores_versiones' },
            { menuType: 'table', name: 'instapps_productos' },
          ]
        },
        {
          menuType: 'menu', name: 'backups', menuContent: [
            { menuType: 'table', name: 'backups_externos', label: 'registro backups' },
            { menuType: 'proc', name: 'show_databases_referentes_backups', label: 'referente backup por DB', autoproced: true },
            { menuType: 'table', name: 'backups', label: 'backups en server con crontab' },
          ]
        },
        {
          menuType: 'menu', name: 'provisorio', menuContent: [
            { menuType: 'proc', name: 'api_call' },
            { menuType: 'table', name: 'api_calls' },
          ]
        },
        {
          menuType: 'menu', name: 'reportes_consultora', menuContent: [
            { menuType: 'table', name: 'instancias_reporte_consultora', label: 'instancias' },
            { menuType: 'table', name: 'dbs_sin_instancia_reporte_consultora', label: 'dbs_sin_instancia' },
            { menuType: 'table', name: 'servers_sin_dbs_ni_instancias_reporte_consultora', label: 'servers_sin_dbs_ni_instancias' },
          ]
        }
      ];
      let menu = { menu: super.getMenu().menu.concat(myMenuPart) }
      return menu;
    }

    prepareGetTables() {
      super.prepareGetTables();
      this.getTableDefinition = {
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
        productos,
        instapp,
        instapps_productos,
        backups,
        backups_externos,
        instancias_reporte_consultora,
        servers_sin_dbs_ni_instancias_reporte_consultora,
        dbs_sin_instancia_reporte_consultora,
        versiones_base,
        versiones,
        servidores_versiones,
        repositorios,
        emails,
        areas,
        api_calls
      }
    }
  }
}