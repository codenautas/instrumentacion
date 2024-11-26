SET search_path = instrumentacion;
set role to instrumentacion_admin;

CREATE OR REPLACE VIEW vw_get_engines AS
SELECT m.puerto AS puerto, s.ip AS host, s.servidor, s.usuario_backups_externos, m.producto
FROM servidores s LEFT JOIN motores m USING (servidor)
WHERE m.producto = 'postgres'
ORDER BY s.ip, m.puerto;

CREATE OR REPLACE VIEW vw_get_databases AS
SELECT database, s.ip, db.port 
FROM instrumentacion.servidores s 
left join instrumentacion.databases db using (servidor)
ORDER BY db.database, s.ip, db.port;

CREATE OR REPLACE FUNCTION fun_insertar_backup_externo(
    p_database TEXT,
    p_servidor TEXT,
    p_port INTEGER,
    p_fecha TIMESTAMP,
    p_exitoso BOOLEAN,
    p_error TEXT,
    p_usuario_db_backup TEXT,
    p_usuario_pc_responsable TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO backups_externos (database, servidor, port, fecha, exitoso, error, usuario_db_backup, usuario_pc_responsable)
    VALUES (p_database, p_servidor, p_port, p_fecha, p_exitoso, p_error, p_usuario_db_backup, p_usuario_pc_responsable);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;


set role to postgres;
CREATE USER usuario_script_backup WITH PASSWORD PASSWORD_EN_COMILLAS_SIMPLES;
REVOKE ALL ON SCHEMA instrumentacion FROM usuario_script_backup;
GRANT USAGE ON SCHEMA instrumentacion TO usuario_script_backup;

GRANT SELECT ON vw_get_engines TO usuario_script_backup;
GRANT SELECT ON vw_get_databases TO usuario_script_backup;
GRANT EXECUTE ON FUNCTION fun_insertar_backup_externo(TEXT, TEXT, INTEGER, TIMESTAMP, BOOLEAN, TEXT, TEXT, TEXT) TO usuario_script_backup;
