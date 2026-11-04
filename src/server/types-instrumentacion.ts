export * from "backend-plus";


declare module "backend-plus" {
    interface WScreens {
        instancia_registrar: {}
    }
    interface AppConfig {
        instrumentacion?: {
            "config-token"?: string
        }
    }
}
