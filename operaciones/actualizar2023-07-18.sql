set search_path=instrumentacion;

alter table "aplicaciones" add column "lenguaje" text;
alter table "aplicaciones" add column "capac_ope" text;
alter table "aplicaciones" add column "tipo_db" text;
alter table "aplicaciones" add column "tecnologias" text;
alter table "aplicaciones" add constraint "lenguaje<>''" check ("lenguaje"<>'');
alter table "aplicaciones" add constraint "capac_ope<>''" check ("capac_ope"<>'');
alter table "aplicaciones" add constraint "tipo_db<>''" check ("tipo_db"<>'');
alter table "aplicaciones" add constraint "tecnologias<>''" check ("tecnologias"<>'');