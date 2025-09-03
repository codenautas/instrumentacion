set search_path to instrumentacion;

alter table instapp change COLname motor to producto;
alter table motores change name to motores_instalados;

alter table instapp add column version_producto text;
alter table "instapp" add constraint "version_producto<>''" check ("version_producto"<>'');
alter table "instapp" add constraint "instapp motores_instalados REL" foreign key ("servidor", "producto", "version_producto") references "motores_instalados" ("servidor", "producto", "version")  on update cascade;
create index "servidor,producto,version_producto 4 instapp IDX" ON "instapp" ("servidor", "producto", "version_producto");

alter table productos add column descripcion text;
alter table "productos" add constraint "descripcion<>''" check ("descripcion"<>'');