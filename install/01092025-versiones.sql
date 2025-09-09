-- Usar el schema instrumentacion
SET search_path TO instrumentacion;
set role to instrumentacion_admin;

-- Agrego tablas versiones_base y versiones
create table "versiones_base" (
  "producto" text, 
  "version_base" text, 
  "fin_soporte_seg" date, 
  "nombre" text,
  "url" text, 
  "release" date, 
  "descripcion" text
, primary key ("producto", "version_base")
);
grant select, insert, update, delete on "versiones_base" to instrumentacion_admin;
grant all on "versiones_base" to instrumentacion_owner;



create table "versiones" (
  "producto" text, 
  "version" text, 
  "version_base" text, 
  "seg_verificada" boolean, 
  "ultima_verif_seg" date, 
  "url" text, 
  "release" date, 
  "descripcion" text
, primary key ("producto", "version")
);
grant select, insert, update, delete on "versiones" to instrumentacion_admin;
grant all on "versiones" to instrumentacion_owner;

-- conss
alter table "versiones_base" add constraint "producto<>''" check ("producto"<>'');
alter table "versiones_base" add constraint "version_base<>''" check ("version_base"<>'');
alter table "versiones_base" add constraint "nombre<>''" check ("nombre"<>'');
alter table "versiones_base" add constraint "url<>''" check ("url"<>'');
alter table "versiones_base" add constraint "descripcion<>''" check ("descripcion"<>'');
alter table "versiones" add constraint "producto<>''" check ("producto"<>'');
alter table "versiones" add constraint "version<>''" check ("version"<>'');
alter table "versiones" add constraint "version_base<>''" check ("version_base"<>'');
alter table "versiones" add constraint "url<>''" check ("url"<>'');
alter table "versiones" add constraint "descripcion<>''" check ("descripcion"<>'');
alter table "versiones" add constraint "versiones_uk_producto-version_base-seg_verificada" unique ("producto", "version_base", "seg_verificada");
alter table "versiones" add constraint "versiones-version_base-prefijo-version" check (version = version_base OR version LIKE version_base || '.%');

-- fks
alter table "versiones_base" add constraint "versiones_base productos REL" foreign key ("producto") references "productos" ("producto")  on update cascade;
alter table "versiones_base" add constraint "versiones_base versiones_base REL" foreign key ("producto", "version_base") references "versiones_base" ("producto", "version_base")  on update cascade;
alter table "versiones" add constraint "versiones productos REL" foreign key ("producto") references "productos" ("producto")  on update cascade;
alter table "versiones" add constraint "versiones versiones_base REL" foreign key ("producto", "version_base") references "versiones_base" ("producto", "version_base")  on update cascade;

-- Índices
create index "producto 4 versiones_base IDX" ON "versiones_base" ("producto");
create index "producto,version_base 4 versiones_base IDX" ON "versiones_base" ("producto", "version_base");
create index "producto 4 versiones IDX" ON "versiones" ("producto");
create index "producto,version_base 4 versiones IDX" ON "versiones" ("producto", "version_base");

-- enances

do $SQL_ENANCE$
 begin
PERFORM enance_table('versiones_base','producto,version_base');
PERFORM enance_table('versiones','producto,version');
end
$SQL_ENANCE$;


-- Renombrar tabla motores -> servidores_versiones
ALTER TABLE motores RENAME TO servidores_versiones;

-- Agregar columna a productos
ALTER TABLE productos ADD COLUMN descripcion text;

-- Constraint: no permitir vacío en descripcion
ALTER TABLE productos
    ADD CONSTRAINT productos_descripcion_not_empty
    CHECK (descripcion <> '');

-------------------------------

create table "instapps_productos" (
  "servidor" text, 
  "instancia" text, 
  "ambiente" text, 
  "producto" text, 
  "version" text, 
  "obs" text
, primary key ("servidor", "instancia", "ambiente", "producto")
);
grant select, insert, update, delete on "instapps_productos" to instrumentacion_admin;
grant all on "instapps_productos" to instrumentacion_owner;

alter table "instapps_productos" add constraint "servidor<>''" check ("servidor"<>'');
alter table "instapps_productos" add constraint "instancia<>''" check ("instancia"<>'');
alter table "instapps_productos" add constraint "ambiente<>''" check ("ambiente"<>'');
alter table "instapps_productos" add constraint "producto<>''" check ("producto"<>'');
alter table "instapps_productos" add constraint "version<>''" check ("version"<>'');
alter table "instapps_productos" add constraint "obs<>''" check ("obs"<>'');

alter table "instapps_productos" add constraint "instapps_productos servidores REL" foreign key ("servidor") references "servidores" ("servidor")  on update cascade;
alter table "instapps_productos" add constraint "instapps_productos instapp REL" foreign key ("instancia", "ambiente") references "instapp" ("instancia", "ambiente")  on update cascade;
alter table "instapps_productos" add constraint "instapps_productos ambientes REL" foreign key ("ambiente") references "ambientes" ("ambiente")  on update cascade;
alter table "instapps_productos" add constraint "instapps_productos productos REL" foreign key ("producto") references "productos" ("producto")  on update cascade;
alter table "instapps_productos" add constraint "instapps_productos versiones REL" foreign key ("producto", "version") references "versiones" ("producto", "version")  on update cascade;

create index "servidor 4 instapps_productos IDX" ON "instapps_productos" ("servidor");
create index "instancia,ambiente 4 instapps_productos IDX" ON "instapps_productos" ("instancia", "ambiente");
create index "ambiente 4 instapps_productos IDX" ON "instapps_productos" ("ambiente");
create index "producto 4 instapps_productos IDX" ON "instapps_productos" ("producto");
create index "producto,version 4 instapps_productos IDX" ON "instapps_productos" ("producto", "version");

do $SQL_ENANCE$
 begin
PERFORM enance_table('instapps_productos','servidor,instancia,ambiente,producto');
end
$SQL_ENANCE$;


-- crear un índice único parcial que impone: a lo sumo 1 fila con seg_verificada = true por (producto, version_base)
CREATE UNIQUE INDEX versiones_unq_producto_version_base_seg_verificada_true
  ON versiones (producto, version_base)
  WHERE seg_verificada IS TRUE;
  
  
INSERT INTO versiones_base (producto, version_base, fin_soporte_seg, nombre, url, release, descripcion)
SELECT DISTINCT
    producto,
    CASE 
        WHEN split_part(version, '.', 2) = '' THEN split_part(version, '.', 1)
        ELSE split_part(version, '.', 1) || '.' || split_part(version, '.', 2)
    END AS version_base,
    NULL::date AS fin_soporte_seg,
    NULL::text AS nombre,
    NULL::text AS url,
    NULL::date AS release,
    NULL::text AS descripcion
FROM servidores_versiones;

INSERT INTO versiones (producto, version, version_base, seg_verificada)
SELECT DISTINCT producto,
       version,
       regexp_replace(version, '^([0-9]+(\.[0-9]+)?).*$', '\1') AS version_base,
       false
FROM servidores_versiones;