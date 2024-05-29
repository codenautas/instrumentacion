

alter table servidores add column "uso" text;
alter table servidores add column "estado" text;
alter table servidores add column "entorno" text;

alter table "servidores" add constraint "uso<>''" check ("uso"<>'');
alter table "servidores" add constraint "estado<>''" check ("estado"<>'');
alter table "servidores" add constraint "entorno<>''" check ("entorno"<>'');

-- aplicaciones
alter table aplicaciones add column "referente" text;
alter table "aplicaciones" add constraint "referente<>''" check ("referente"<>'');

-- instapps
alter table instapps add column "criticidad" text;
alter table instapps add column "tolerancia_downtime" text;
alter table instapps add constraint "criticidad<>''" check ("criticidad"<>'');
alter table instapps add constraint "tolerancia_downtime<>''" check ("tolerancia_downtime"<>'');

