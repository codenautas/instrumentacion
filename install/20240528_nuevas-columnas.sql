

alter table servidores add column "uso" text;
alter table servidores add column "estado" text;
alter table servidores add column "entorno" text;

alter table "servidores" add constraint "uso<>''" check ("uso"<>'');
alter table "servidores" add constraint "estado<>''" check ("estado"<>'');
alter table "servidores" add constraint "entorno<>''" check ("entorno"<>'');

-- aplicaciones
alter table aplicaciones add column "referente" text;
alter table "aplicaciones" add constraint "referente<>''" check ("referente"<>'');

-- instapp
alter table instapp add column "criticidad" text;
alter table instapp add column "tolerancia_downtime" text;
alter table instapp add constraint "criticidad<>''" check ("criticidad"<>'');
alter table instapp add constraint "tolerancia_downtime<>''" check ("tolerancia_downtime"<>'');

