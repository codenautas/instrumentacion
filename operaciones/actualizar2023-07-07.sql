set search_path=instrumentacion;
create table "categorias_doc" (
  "categoria_doc" text
, primary key ("categoria_doc")
);
grant select, insert, update, delete on "categorias_doc" to instrumentacion_admin;
grant all on "categorias_doc" to instrumentacion_owner;
alter table instapp add categoria_doc text
alter table "instapp" add constraint "categoria_doc<>''" check ("categoria_doc"<>'');
create index "categoria_doc 4 instapp IDX" ON "instapp" ("categoria_doc");
alter table "instapp" add constraint "instapp categorias_doc REL" foreign key ("categoria_doc") references "categorias_doc" ("categoria_doc")  on update cascade;
