"use strict";

// Columna "yaml" de la grilla de instapp (clientSide 'verYaml', ver table-instapp.ts): un botón que muestra el
// local-config.yaml de la instancia en una ventana, con un botón para copiarlo.

import * as React from "react";
import { useState } from "react";
import * as ReactDOM from "react-dom";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

type Depot = {
    row: Record<string, unknown>
    rowControls: Record<string, HTMLElement>
}

declare const myOwn: {
    clientSides: Record<string, { prepare: (depot: Depot, fieldName: string) => void, update: (depot: Depot, fieldName: string) => void }>
    ajax: {
        instancia_yaml_ver: (params: { instancia: string, ambiente: string }) => Promise<string>
    }
}

// navigator.clipboard sólo existe en páginas seguras (https o localhost); si no está se copia con un textarea
async function copiarTexto(texto: string): Promise<boolean> {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(texto);
            return true;
        }
    } catch {
        // se sigue con el plan B
    }
    var area = document.createElement('textarea');
    area.value = texto;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var copiado = false;
    try {
        copiado = document.execCommand('copy');
    } catch {
        copiado = false;
    }
    document.body.removeChild(area);
    return copiado;
}

function DialogoYaml(props: { titulo: string, yaml: string, cerrar: () => void }) {
    var [copiado, setCopiado] = useState(false);
    var [fallo, setFallo] = useState(false);
    var copiar = async () => {
        var ok = await copiarTexto(props.yaml);
        setCopiado(ok);
        setFallo(!ok);
        if (ok) setTimeout(() => setCopiado(false), 1500);
    };
    return <Dialog open onClose={props.cerrar} maxWidth="md" fullWidth>
        <DialogTitle>{props.titulo}</DialogTitle>
        <DialogContent dividers>
            <Box component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: 13, overflowX: 'auto', userSelect: 'text' }}>{props.yaml}</Box>
        </DialogContent>
        <DialogActions>
            {fallo && <Box sx={{ mr: 'auto', color: 'error.main', fontSize: 13 }}>No se pudo copiar: seleccioná el texto y copialo a mano.</Box>}
            <Button onClick={copiar}>{copiado ? 'Copiado ✓' : 'Copiar'}</Button>
            <Button onClick={props.cerrar}>Cerrar</Button>
        </DialogActions>
    </Dialog>;
}

async function verYaml(instancia: string, ambiente: string) {
    try {
        var yaml = await myOwn.ajax.instancia_yaml_ver({ instancia, ambiente });
        var contenedor = document.createElement('div');
        document.body.appendChild(contenedor);
        var cerrar = () => {
            ReactDOM.unmountComponentAtNode(contenedor);
            document.body.removeChild(contenedor);
        };
        ReactDOM.render(<DialogoYaml titulo={`local-config.yaml de ${instancia} (${ambiente})`} yaml={yaml} cerrar={cerrar} />, contenedor);
    } catch (err) {
        alert(err instanceof Error ? err.message : String(err));
    }
}

myOwn.clientSides.verYaml = {
    prepare: (_depot, _fieldName) => { },
    update: (depot, fieldName) => {
        var celda = depot.rowControls[fieldName];
        celda.innerHTML = '';
        var boton = document.createElement('button');
        boton.type = 'button';
        boton.textContent = 'ver yaml';
        boton.onclick = () => { verYaml(String(depot.row.instancia), String(depot.row.ambiente)); };
        celda.appendChild(boton);
    }
};
