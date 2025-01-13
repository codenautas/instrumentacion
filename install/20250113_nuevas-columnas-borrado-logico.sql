set search_path=instrumentacion;
alter table databases add column "eliminado" BOOLEAN DEFAULT FALSE;
alter table servidores add column "eliminado" BOOLEAN DEFAULT FALSE;
