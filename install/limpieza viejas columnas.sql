set search_path=instrumentacion;

alter table "servidores" drop column "server_engine";
alter table "servidores" drop column "conf_path";
alter table "servidores" drop column "coderun";
alter table "servidores" drop column "web";

alter table "instapp" drop column "categoria_doc";
drop table "categorias_doc";

alter table "aplicaciones" drop column "version";
alter table "aplicaciones" drop column "bp_version";

alter table "databases" drop column "search_path";
alter table "databases" drop column "path_interno";
alter table "databases" drop column "so_user";
alter table "databases" drop column "motor";
alter table "databases" drop column "url";
alter table "databases" drop column "servicio";
alter table "databases" drop column "enabled";
alter table "databases" drop column "fuente";
alter table "databases" drop column "so_path";
