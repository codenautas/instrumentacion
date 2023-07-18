set search_path=instrumentacion;

alter table "aplicaciones" add column "lenguaje" text;
alter table "aplicaciones" add column "capac_ope" text;
alter table "aplicaciones" add column "tipo_db" text;
alter table "aplicaciones" add column "tecnologias" text;
alter table "aplicaciones" add constraint "lenguaje<>''" check ("lenguaje"<>'');
alter table "aplicaciones" add constraint "capac_ope<>''" check ("capac_ope"<>'');
alter table "aplicaciones" add constraint "tipo_db<>''" check ("tipo_db"<>'');
alter table "aplicaciones" add constraint "tecnologias<>''" check ("tecnologias"<>'');

create table "operativos" (
  "operativo" text, 
  "periodo" text
, primary key ("operativo")
);
grant select, insert, update, delete on "operativos" to instrumentacion_admin;
grant all on "operativos" to instrumentacion_owner;

alter table "operativos" add constraint "operativo<>''" check ("operativo"<>'');
alter table "operativos" add constraint "periodo<>''" check ("periodo"<>'');

alter table "instapp" add column "uso" text;
alter table "instapp" add column "operativo" text;
alter table "instapp" add constraint "uso<>''" check ("uso"<>'');
alter table "instapp" add constraint "operativo<>''" check ("operativo"<>'');
alter table "instapp" add constraint "instapp operativos REL" foreign key ("operativo") references "operativos" ("operativo")  on update cascade;

create index "operativo 4 instapp IDX" ON "instapp" ("operativo");