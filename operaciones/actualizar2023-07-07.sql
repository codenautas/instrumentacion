set search_path=instrumentacion;
create table "categorias_doc" (
  "categoria_doc" text
, primary key ("categoria_doc")
);
grant select, insert, update, delete on "categorias_doc" to instrumentacion_admin;
grant all on "categorias_doc" to instrumentacion_owner;
alter table "instapp" add "categoria_doc" text;
alter table "instapp" add constraint "categoria_doc<>''" check ("categoria_doc"<>'');
create index "categoria_doc 4 instapp IDX" ON "instapp" ("categoria_doc");
alter table "instapp" add constraint "instapp categorias_doc REL" foreign key ("categoria_doc") references "categorias_doc" ("categoria_doc")  on update cascade;

alter table "aplicaciones" add "descripcion" text;
alter table "aplicaciones" add constraint "descripcion<>''" check ("descripcion"<>'');

update instapp
set ambiente = 'producción'
where ambiente in ('producción (apagada)', 'prod', 'produc', 'produccion');

update instapp
set ambiente = 'prueba'
where ambiente in ('evaluación', 'testing', 'testeo', 'test (apagada)', 'testeo-capacitación', 'test', 'mapa');

update instapp 
set ambiente = 'capacitación'
where ambiente in ('capacitacion');

create table "ambientes" (
  "ambiente" text,
  "orden" integer
, primary key ("ambiente")
);
grant select, insert, update, delete on "ambientes" to instrumentacion_admin;
grant all on "ambientes" to instrumentacion_owner;

insert into ambientes ("ambiente","orden") values ("producción","1"),("prueba","2"),("capacitación","3");

alter table "ambientes" add constraint "ambiente<>''" check ("ambiente"<>'');

alter table "instapp" add constraint "instapp ambientes REL" foreign key ("ambiente") references "ambientes" ("ambiente")  on update cascade;
create index "ambiente 4 instapp IDX" ON "instapp" ("ambiente");