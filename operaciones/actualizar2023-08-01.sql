set search_path=instrumentacion;
alter table "servidores" add column "base_url" text;
alter table "servidores" add constraint "base_url<>''" check ("base_url"<>'');