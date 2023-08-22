set search_path=instrumentacion;
alter table "instapp" add column "db_servidor" text;
alter table "instapp" add constraint "db_servidor<>''" check ("db_servidor"<>'');

update "instapp"
set "db_servidor" = "servidor"

alter table "instapp" add constraint "instapp databases REL" foreign key ("db_servidor", "database", "db_port") references "databases" ("servidor", "database", "port")  on update cascade;
create index "db_servidor,database,db_port 4 instapp IDX" ON "instapp" ("db_servidor", "database", "db_port");
