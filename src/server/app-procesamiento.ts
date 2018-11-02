"use strict";

import * as varcal from "varcal";
import {procedures} from "./procedures-instrumentacion";

export type Constructor<T> = new(...args: any[]) => T;
export function emergeAppInstrumentacion<T extends Constructor<varcal.VarCalType>>(Base:T){
    
    return class AppInstrumentacion extends Base{
        myProcedures: varcal.ProcedureDef[] = procedures;

        constructor(...args:any[]){ 
            super(args);    
            this.initialize();
            this.allClientFileNames.push({type:'js', src: 'client/instrumentacion.js' })
        }

        configStaticConfig(){
            super.configStaticConfig();
            this.setStaticConfig(`
          server:
            port: 3034
            base-url: /instrumentacion
            session-store: memory
          db:
            motor: postgresql
            host: localhost
            database: instrumentacion_db
            schema: instrumentacion
            user: instrumentacion_user
            search_path: 
            - instrumentacion
          install:
            dump:
              db:
                owner: instrumentacion_owner
              admin-can-create-tables: true
              enances: inline
              skip-content: true
              scripts:
                post-adapt: 
                - para-install.sql
                - ../node_modules/datos-ext/install/controlar_modificacion_estructura_cerrada.sql
                - ../node_modules/varcal/install/wrappers.sql
                - ../node_modules/pg-triggers/lib/recreate-his.sql
                - ../node_modules/pg-triggers/lib/table-changes.sql
                - ../node_modules/pg-triggers/lib/function-changes-trg.sql
                - ../node_modules/pg-triggers/lib/enance.sql
          login:
            table: usuarios
            userFieldName: usuario
            passFieldName: md5clave
            rolFieldName: rol
            infoFieldList: [usuario, rol]
            activeClausule: activo
            plus:
              maxAge-5-sec: 5000    
              maxAge: 864000000
              maxAge-10-day: 864000000
              allowHttpLogin: true
              fileStore: false
              skipCheckAlreadyLoggedIn: true
              loginForm:
                formTitle: Instrumentacion
                usernameLabel: usuario
                passwordLabel: md5clave
                buttonLabel: entrar
                formImg: img/login-lock-icon.png
              chPassForm:
                usernameLabel: usuario
                oldPasswordLabel: clave anterior
                newPasswordLabel: nueva clave
                repPasswordLabel: repetir nueva clave
                buttonLabel: Cambiar
                formTitle: Cambio de clave
            messages:
              userOrPassFail: el nombre de usuario no existe o la clave no corresponde
              lockedFail: el usuario se encuentra bloqueado
              inactiveFail: es usuario está marcado como inactivo
          client-setup:
            title: Instrumentacion
            cursors: true
            lang: es
            menu: true
            `);
        }

        getMenu():varcal.MenuDefinition{
            //TODO: es igual que en datos-ext llevarlo a varcal
            let myMenuPart:varcal.MenuInfo[]=[
                // {menuType:'table', name:'grupo_personas'}, // GENERAR DINAMICAMENTE A PARTIR DE UA
            ];
            let menu = {menu: super.getMenu().menu.concat(myMenuPart)}
            return menu;
        }
        // prepareGetTables(){
        //     //TODO: es igual que en datos-ext llevarlo a varcal
        //     super.prepareGetTables();
        //     this.getTableDefinition={
        //         ...this.getTableDefinition,
        //         // grupo_personas // GENERAR DINAMICAMENTE A PARTIR DE UA
        //     }
        // }
    }
}