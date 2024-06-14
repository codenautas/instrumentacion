

alter table servidores add column "referentes" text;
alter table servidores add column "backups_externos" text;

alter table "servidores" add constraint "referentes<>''" check ("referentes"<>'');
alter table "servidores" add constraint "backups_externos<>''" check ("backups_externos"<>'');
