"use strict";

import { AppBackend } from "backend-plus";
import { emergeAppInstrumentacion } from "./app-instrumentacion";

var AppInstrumentacion = emergeAppInstrumentacion(AppBackend);

new AppInstrumentacion().start();