set search_path=instrumentacion;

ALTER TABLE servidores RENAME COLUMN backups_externos TO usuario_backups_externos;
alter table servidores add constraint "servidores usuarios REL" foreign key ("usuario_backups_externos") references "usuarios" ("usuario")  on update cascade;

alter table "ip" add constraint "ip usuarios REL" foreign key ("uhabitual") references "usuarios" ("usuario")  on update cascade;

create table "backups_externos" (
  "database" text, 
  "servidor" text, 
  "port" integer, 
  "fecha" text,
  "exitoso" boolean, 
  "error" text, 
  "usuario_db_backup" text, 
  "usuario_pc_responsable" text, 
, primary key ("database", "servidor", "port", "fecha")
);
grant select, insert, update, delete on "backups_externos" to instrumentacion_admin;
grant all on "backups_externos" to instrumentacion_owner;

alter table "backups_externos" add constraint "database<>''" check ("database"<>'');
alter table "backups_externos" add constraint "servidor<>''" check ("servidor"<>'');
alter table "backups_externos" add constraint "error<>''" check ("error"<>'');
alter table "backups_externos" add constraint "usuario_db_backup<>''" check ("usuario_db_backup"<>'');
alter table "backups_externos" add constraint "usuario_pc_responsable<>''" check ("usuario_pc_responsable"<>'');
alter table "backups_externos" add constraint "fecha<>''" check ("fecha"<>'');

alter table "backups_externos" add constraint "backups_externos databases REL" foreign key ("database", "servidor", "port") references "databases" ("database", "servidor", "port")  on update cascade;
alter table "backups_externos" add constraint "backups_externos servidores REL" foreign key ("servidor") references "servidores" ("servidor")  on update cascade;
alter table "backups_externos" add constraint "backups_externos usuarios REL" foreign key ("usuario_pc_responsable") references "usuarios" ("usuario")  on update cascade;

create index "database,servidor,port 4 backups_externos IDX" ON "backups_externos" ("database", "servidor", "port");
create index "servidor 4 backups_externos IDX" ON "backups_externos" ("servidor");
create index "usuario_pc_responsable 4 backups_externos IDX" ON "backups_externos" ("usuario_pc_responsable");

do $SQL_ENANCE$
 begin
PERFORM enance_table('backups_externos','database,servidor,port,fecha');
end
$SQL_ENANCE$;