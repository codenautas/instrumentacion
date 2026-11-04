"use strict";

// require-bro no deduce estos dos nombres desde el global (ver adapt.ts de dmencu)
declare global {
    interface Window {
        require: { definedModules: Record<string, unknown> }
        ReactDOM: unknown
        MaterialUI: unknown
    }
}

window.require.definedModules["react-dom"] = window.ReactDOM;
window.require.definedModules["@mui/material"] = window.MaterialUI;

export {}