import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { join } from 'path';

const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else {
    dotenv.config();
}

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.SSL_ENABLED === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: false,
    entities: [join(__dirname, '**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
};

export const AppDataSource = new DataSource(dataSourceOptions);