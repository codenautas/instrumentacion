"use strict";

import { AppBackend, emergeAppDatosExt, emergeAppOperativos } from "datos-ext";
import { emergeAppConsistencias } from "consistencias";
import { emergeAppExportador } from "exportador";
import { emergeAppVarCal } from "varcal";
import { emergeAppInstrumentacion } from "./app-instrumentacion";

var AppInstrumentacion = emergeAppInstrumentacion(emergeAppVarCal(emergeAppConsistencias(emergeAppExportador(emergeAppDatosExt(emergeAppOperativos(AppBackend))))));

new AppInstrumentacion().start();