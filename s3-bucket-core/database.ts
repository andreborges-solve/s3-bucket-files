import { Pool } from 'pg';

export const db = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

export function connection(): void {
    db.connect();
    console.log('Conexão com banco de dados concluida com sucesso');
}