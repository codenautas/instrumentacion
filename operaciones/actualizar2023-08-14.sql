set search_path=instrumentacion;
create table "textos_doc" (
  "codigo" text, 
  "texto" text
, primary key ("codigo")
);
grant select, insert, update, delete on "textos_doc" to instrumentacion_admin;
grant all on "textos_doc" to instrumentacion_owner;

alter table "textos_doc" add constraint "codigo<>''" check ("codigo"<>'');
alter table "textos_doc" add constraint "texto<>''" check ("texto"<>'');

insert into "textos_doc" ("codigo") values
('nombre_de_archivo'),
('encabezado'),
('pie');