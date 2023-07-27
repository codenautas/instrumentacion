set search_path=instrumentacion;
alter table "operativos" add column "nombre" text;
alter table "operativos" add column "descripcion" text;
alter table "operativos" add constraint "nombre<>''" check ("nombre"<>'');
alter table "operativos" add constraint "descripcion<>''" check ("descripcion"<>'');