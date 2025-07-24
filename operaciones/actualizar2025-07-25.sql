set search_path = "instrumentacion", public;

create table "emails" (
  "instancia" text, 
  "ambiente" text, 
  "email" text, 
  "descripcion" text, 
  "password_update_date" date,
  primary key ("instancia", "ambiente", "email")
);

grant select, insert, update, delete on "emails" to instrumentacion_user;
grant all on "emails" to instrumentacion_owner;

alter table "emails" add constraint "instancia<>''" check ("instancia"<>'');
alter table "emails" add constraint "ambiente<>''" check ("ambiente"<>'');
alter table "emails" add constraint "email<>''" check ("email"<>'');
alter table "emails" add constraint "descripcion<>''" check ("descripcion"<>'');

alter table "emails" add constraint "emails instapp REL" foreign key ("instancia", "ambiente") references "instapp" ("instancia", "ambiente")  on update cascade;