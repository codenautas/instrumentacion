set search_path=instrumentacion;

ALTER TABLE servidores RENAME COLUMN backups_externos TO usuario_backups_externos;
alter table servidores add constraint "servidores usuarios REL" foreign key ("usuario_backups_externos") references "usuarios" ("usuario")  on update cascade;