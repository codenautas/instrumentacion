"use strict";

// Prueba la generación de la página /documentacion sin base de datos.

const assert = require('assert/strict');
const { AppBackend } = require('backend-plus');
const { emergeAppInstrumentacion } = require('../../dist/server/app-instrumentacion.js');

const AppInstrumentacion = emergeAppInstrumentacion(AppBackend);

function aHtml(contenido) {
    return contenido.map(e => e.toHtmlText({}, {})).join('');
}

const filaBase = {
    operativo: 'EAH2024',
    ope_nom: 'Encuesta Anual de Hogares',
    ope_annio: 2024,
    ope_desc: 'Descripción del operativo',
    ope_onda: null,
    repositorio: 'eah',
    descripcion: 'Sistema de la EAH',
    git_host: 'https://github.com/',
    git_group: '/codenautas/',
    git_project: 'eah',
    lenguaje: 'TypeScript',
    capac_ope: null,
    tipo_db: 'PostgreSQL',
    tecnologias: null,
    ambiente: 'produccion',
    uso: 'campo',
    amb_orden: 1,
    ser_base_url: 'https://servidor.example/',
    base_url: '/eah',
    fecha_instalacion: new Date(2024, 2, 5),
};

describe('documentación', function () {
    let be;

    before(function () {
        be = new AppInstrumentacion();
    });

    it('convertDate formatea dd/mm/aaaa', function () {
        assert.equal(be.convertDate(new Date(2024, 2, 5)), '05/03/2024');
        assert.equal(be.convertDate(new Date(2023, 11, 31)), '31/12/2023');
    });

    it('groupBy agrupa por la propiedad', function () {
        const grupos = be.groupBy([{ o: 'a', n: 1 }, { o: 'b', n: 2 }, { o: 'a', n: 3 }], 'o');
        assert.deepEqual(grupos, { a: [{ o: 'a', n: 1 }, { o: 'a', n: 3 }], b: [{ o: 'b', n: 2 }] });
    });

    it('arma la página de un operativo con repositorio, URLs y características', function () {
        const texto = aHtml(be.contentPage([filaBase]));
        assert.match(texto, /EAH2024/);
        assert.match(texto, /05\/03\/2024/);
        assert.match(texto, /href='https:\/\/github.com\/codenautas\/eah'/);
        assert.match(texto, /Urls de Acceso/);
        assert.match(texto, /href='https:\/\/servidor.example\/eah'/);
        assert.match(texto, /TypeScript/);
    });

    it('el pase a producción es la instalación del primer ambiente', function () {
        const filas = [
            { ...filaBase, ambiente: 'test', amb_orden: 2, fecha_instalacion: new Date(2023, 0, 10) },
            { ...filaBase, ambiente: 'produccion', amb_orden: 1, fecha_instalacion: new Date(2024, 2, 5) },
        ];
        const texto = aHtml(be.contentPage(filas));
        assert.match(texto, /05\/03\/2024/);
        assert.doesNotMatch(texto, /10\/01\/2023/);
    });

    it('no muestra "Urls de Acceso" si ninguna instancia tiene datos', function () {
        const fila = { ...filaBase, ambiente: null, uso: null, ser_base_url: null, base_url: null };
        assert.doesNotMatch(aHtml(be.contentPage([fila])), /Urls de Acceso/);
    });

    it('omite las secciones sin datos', function () {
        const fila = { ...filaBase, repositorio: null, descripcion: null, git_host: null, git_group: null, git_project: null, lenguaje: null, tipo_db: null };
        const texto = aHtml(be.contentPage([fila]));
        assert.doesNotMatch(texto, /repositorios/);
        assert.doesNotMatch(texto, /Características/);
    });
});
