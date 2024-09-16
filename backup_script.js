const { Client } = require('pg');
const { exec } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const yaml = require('js-yaml');

// Leer configuración desde local-config.yaml
function loadConfig() {
    try {
        const configFile = fs.readFileSync('local-config.yaml', 'utf8');
        return yaml.load(configFile);
    } catch (e) {
        console.error('Error al cargar la configuración:', e);
        process.exit(1);
    }
}

// Obtener configuración
const localConfig = loadConfig().db_instrumentacion;
const instrumentacionDBClient = new Client({
    host: localConfig.host,
    user: localConfig.user,
    port: localConfig.port,
    database: localConfig.database,
    password: localConfig.password
});

async function getEnginesToBackup() {
    try {
        await instrumentacionDBClient.connect();
        const query = `
            set search_path=$1;
            SELECT m.puerto AS puerto, s.ip as host, s.servidor, s.usuario_backups_externos, m.producto
            FROM servidores s left join motores m using(servidor)
            where m.producto ='postgres' and s.usuario_backups_externos = $2;
        `;
        const res = await instrumentacionDBClient.query(query, [localConfig.schema, localConfig.usuario_inst_responsable_backup]);
        await instrumentacionDBClient.end();
        return res.rows;
    } catch (err) {
        console.error('Error al obtener servidores:', err);
        throw err;
    }
}

async function getDatabases(engine) {
    await instrumentacionDBClient.connect();
    const res = await instrumentacionDBClient.query(
        `set search_path=$1;
        SELECT database, s.ip, db.port FROM instrumentacion.servidores s left join instrumentacion.databases db using (servidor)
        where s.ip = $2 and db.port = $3 
        AND db.database !~ 'test|prueba|muleto|template|postgres|bkp|bak|capa';
    `,[localConfig.schema, engine.host, engine.puerto]);
    await instrumentacionDBClient.end();
    return res.rows.map(row => row.database);
}

async function backupDatabase(engine, dbName, backupDir) {
    console.log(`Iniciando backup de la base de datos: ${dbName} en el engine: ${engine.host}: ${engine.puerto}`);

    const dumpFilePath = path.join(backupDir, `${dbName}.sql`);

    // Comando pg_dump para generar el backup en formato de texto plano, excluyendo los datos de los esquemas "his" y "temp"
    const dumpCommand = `"C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe" -h ${engine.host} -U ${localConfig.usuario_backup} -F p --exclude-table-data='his.*' --exclude-table-data='temp.*' -f "${dumpFilePath}" ${dbName}`;

    return new Promise((resolve, reject) => {
        const dumpProcess = exec(dumpCommand);

        let stderr = '';
        dumpProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        dumpProcess.on('exit', (code) => {
            if (code === 0) {
                console.log(`Backup de la base de datos ${dbName} completado`);
                resolve(dumpFilePath);
            } else {
                console.error(`Error al realizar el backup de la base de datos ${dbName}`);
                console.error(`pg_dump falló con código ${code}`);
                console.error(`Error: ${stderr}`);
                reject(new Error(`pg_dump falló con código ${code}. Detalles: ${stderr}`));
            }
        });

        dumpProcess.on('error', (err) => {
            console.error(`Error al ejecutar pg_dump: ${err.message}`);
            reject(new Error(`Error al ejecutar pg_dump: ${err.message}. Asegúrate de que pg_dump está en el PATH.`));
        });
    });
}

// Función para comprimir el archivo de backup
async function compressBackup(filePath) {
    const zipFilePath = `${filePath}.zip`;
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => {
        console.log(`Backup comprimido en: ${zipFilePath}`);
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);
    archive.file(filePath, { name: path.basename(filePath) });
    await archive.finalize();

    return zipFilePath;
}

// Función principal
async function main() {
    console.log('Iniciando proceso de backup...');
    try {
        // Obtener servidores desde la DB 'instrumentacion_db'
        const engines = await getEnginesToBackup();
        console.log('usuario responsable de backupear los siguientes engines: '+engines.map(e=>{e.host, e.puerto}))
        
        for (const engine of engines) {
            const backupDir = `./local-backups/${engine.servidor}_${engine.host}`;
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            try {
                const databases = await getDatabases(engine);
                console.log(`Para el engine ${e.host, e.puerto} se intentaran backupear las siguientes DBs: ${databases}`)
                for (const dbName of databases) {
                    const backupPath = await backupDatabase(engine, dbName, backupDir);
                    await compressBackup(backupPath);
                    fs.unlinkSync(backupPath); // Elimina el archivo .sql después de comprimirlo
                }

                console.log(`Proceso completado para el engine ${engine.host}, ${engine.port}`);
            } catch (err) {
                console.error(`Error en el engine ${engine.host}, ${engine.port}: ${err.message}`);
            }
        }

        console.log('Proceso de backup finalizado.');
    } catch (err) {
        console.error('Error durante el proceso de backup:', err.message);
    }
}

main();
