-- Usar el schema instrumentacion
SET search_path TO instrumentacion;
set role to instrumentacion_admin;

-- Agrego tablas versiones_base y versiones
create table "versiones_base" (
  "producto" text, 
  "version_base" text, 
  "fin_soporte_seg" date, 
  "nombre" text, 
  "dependencia_producto" text, 
  "dependencia_version_base" text, 
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
alter table "versiones_base" add constraint "dependencia_producto<>''" check ("dependencia_producto"<>'');
alter table "versiones_base" add constraint "dependencia_version_base<>''" check ("dependencia_version_base"<>'');
alter table "versiones_base" add constraint "url<>''" check ("url"<>'');
alter table "versiones_base" add constraint "descripcion<>''" check ("descripcion"<>'');
alter table "versiones" add constraint "producto<>''" check ("producto"<>'');
alter table "versiones" add constraint "version<>''" check ("version"<>'');
alter table "versiones" add constraint "version_base<>''" check ("version_base"<>'');
alter table "versiones" add constraint "url<>''" check ("url"<>'');
alter table "versiones" add constraint "descripcion<>''" check ("descripcion"<>'');
alter table "versiones" add constraint "versiones_uk_producto-version_base-seg_verificada" unique ("producto", "version_base", "seg_verificada");
alter table "versiones" add constraint "versiones-version_base-prefijo-version" check (version LIKE version_base || '.%');

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


-- Renombrar columna motor -> producto en instapp
ALTER TABLE instapp RENAME COLUMN motor TO producto;

-- Renombrar tabla motores -> motores_instalados
ALTER TABLE motores RENAME TO motores_instalados;

-- Agregar columna
ALTER TABLE instapp ADD COLUMN version_producto text;

-- Constraint: no permitir vacío en version_producto
ALTER TABLE instapp
    ADD CONSTRAINT instapp_version_producto_not_empty
    CHECK (version_producto <> '');

-- Foreign key hacia motores_instalados
ALTER TABLE instapp
    ADD CONSTRAINT instapp_motores_instalados_fk
    FOREIGN KEY (servidor, producto, version_producto)
    REFERENCES motores_instalados (servidor, producto, version)
    ON UPDATE CASCADE;

-- Crear índice
CREATE INDEX instapp_servidor_producto_version_idx
    ON instapp (servidor, producto, version_producto);

-- Agregar columna a productos
ALTER TABLE productos ADD COLUMN descripcion text;

-- Constraint: no permitir vacío en descripcion
ALTER TABLE productos
    ADD CONSTRAINT productos_descripcion_not_empty
    CHECK (descripcion <> '');


