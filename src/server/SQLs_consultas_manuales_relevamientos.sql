-- Servidores con DBs, pero sin motor de db
SET search_path = instrumentacion;
select s.servidor, 
	string_agg(distinct m.producto, ', ') motores,
	string_agg(distinct dbs.database, ', ') dbs
	from servidores s 
	left join databases dbs using(servidor)
	left join motores m using(servidor)
where dbs."database" is not null and 
	(m.producto is null OR m.producto not in ('postgres', 'mysql', 'sqlserver'))
group by s.servidor

-----------------------------------------

-- DBs sin instapp
SET search_path = instrumentacion;
select dbs.database
from databases dbs left join instapp i on (dbs.servidor=i.db_servidor and dbs.database=i.database and dbs.port = i.db_port)
where i.instancia is null

-----------------------------------------

-- Servidores con instapp pero sin motor de web server
SET search_path = instrumentacion;
select s.servidor, 
	string_agg(distinct m.producto, ', ') motores,
	string_agg(distinct i.instancia, ', ') instancias
	from servidores s 
	left join instapp i using(servidor)
	left join motores m using(servidor)
where i.instancia is not null and 
	(m.producto is null OR m.producto not in ('apache', 'nginx', 'iis', 'tomcat'))
group by s.servidor

-----------------------------------------

-- Servidores con instapp pero sin motor de lenguaje
SET search_path = instrumentacion;
select s.servidor, 
	string_agg(distinct m.producto, ', ') motores,
	string_agg(distinct i.instancia, ', ') instancias
	from servidores s 
	left join instapp i using(servidor)
	left join motores m using(servidor)
where i.instancia is not null and 
	(m.producto is null OR m.producto not in ('node', 'python', 'php'))
group by s.servidor

-----------------------------------------

-- DBs sin rows exitosos en tabla "backups_externos" de los últimos 4 dias, de dbs
-- que no estén eliminadas, ni de servidores eliminados, cuyo "responsable backup extrno" sea distinto a 
-- "equipo servidores", y que no tengan los strings muleto|template|postgres|bkp|bak|capa|old|hasta
-- dentro del nombre de la db
SET search_path = instrumentacion;
select dbs.database, dbs.servidor, dbs.port, s.usuario_backups_externos
from databases dbs left join
(	SELECT database, servidor, port, fecha, exitoso
    FROM backups_externos
    WHERE fecha IS NOT NULL AND DATE(fecha) >= CURRENT_DATE - INTERVAL '4 days' AND exitoso is true
 	order by database
) be_ok_last_days
using(database, servidor, port)
left join servidores s using(servidor)
WHERE dbs.eliminado is not true AND s.eliminado is not true 
AND dbs.database !~ 'muleto|template|postgres|bkp|bak|capa|old|hasta'
AND COALESCE(s.usuario_backups_externos, '') <> 'equipo servidores'
AND be_ok_last_days.database is null 
order by servidor