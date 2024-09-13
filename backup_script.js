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
const config = loadConfig();
const dbConfig = config.db;

// Función para obtener los servidores desde la DB instrumentacion_db
async function getServersFromDB(usuario) {
    const client = new Client({
        host: dbConfig.host,
        user: dbConfig.user,
        port: dbConfig.port,
        database: dbConfig.database,
        password: dbConfig.password
    });
    try {
        await client.connect();
        const query = `
            SELECT s.servidor, s.ip as host, s.usuario_backups_externos, m.producto, m.puerto AS user
            FROM instrumentacion.servidores s left join instrumentacion.motores m using(servidor)
            where m.producto ='postgres' and s.usuario_backups_externos = $1;
        `;
        const res = await client.query(query, [usuario]);
        await client.end();
        return res.rows; // Devuelve una lista de servidores
    } catch (err) {
        console.error('Error al obtener servidores:', err);
        throw err;
    }
}

// Función para obtener todas las bases de datos de un servidor
async function getDatabases(serverConfig) {
    const client = new Client({
        host: serverConfig.host,
        user: serverConfig.user,
        port: serverConfig.port,
        database: 'postgres' // Conectarse a la base de datos por defecto
    });

    await client.connect();

    const res = await client.query(
        `SELECT datname FROM pg_database 
        WHERE datistemplate = false
        AND datname NOT SIMILAR TO '%(test|prueba|muleto|template|postgres|bkp|bak|capa)%'
        ORDER BY 1;
    `);
    await client.end();

    return res.rows.map(row => row.datname);
}

// Función para hacer el backup de una base de datos
async function backupDatabase(serverConfig, dbName, backupDir) {
    console.log(`Iniciando backup de la base de datos: ${dbName} en el servidor: ${serverConfig.host}`);

    const dumpFilePath = path.join(backupDir, `${dbName}.sql`);

    // Comando pg_dump para generar el backup en formato de texto plano, excluyendo los datos de los esquemas "his" y "temp"
    const dumpCommand = `"C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe" -h ${serverConfig.host} -U ${serverConfig.user} -F p --exclude-table-data='his.*' -f "${dumpFilePath}" ${dbName}`;

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

    // Obtener el usuario desde la línea de comandos y verificar si está presente
    const usuarioBackups = process.argv[2];
    if (!usuarioBackups) {
        console.error('Error: Debes proporcionar el usuario para obtener los servidores.');
        process.exit(1); // Finaliza el script con código de error
    }

    try {
        // Obtener servidores desde la DB 'instrumentacion_db'
        const servers = await getServersFromDB(usuarioBackups);

        for (const server of servers) {
            const backupDir = `./local-backups/${server.servidor}_${server.host}`;

            // Crear el directorio para los backups del servidor si no existe
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            try {
                const databases = await getDatabases(server);
                console.log(`Conectado al servidor ${server.host}. Bases de datos: ${databases.join(', ')}`);

                for (const dbName of databases) {
                    const backupPath = await backupDatabase(server, dbName, backupDir);
                    await compressBackup(backupPath);
                    fs.unlinkSync(backupPath); // Elimina el archivo .sql después de comprimirlo
                }

                console.log(`Proceso completado para el servidor ${server.host}`);
            } catch (err) {
                console.error(`Error en el servidor ${server.host}: ${err.message}`);
            }
        }

        console.log('Proceso de backup finalizado.');
    } catch (err) {
        console.error('Error durante el proceso de backup:', err.message);
    }
}

main();
