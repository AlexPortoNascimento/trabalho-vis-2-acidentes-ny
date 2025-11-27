
import { loadDb } from './config';

export class Crash {
    constructor(filename = 'Motor_Vehicle_Collisions_-_Crashes_20251126.csv') {
        this.filename = filename;
        this.table = 'crashes';
    }
    
    async init() {
        this.db = await loadDb();
        this.conn = await this.db.connect();
    }

    async loadCrash() {
        if (!this.db || !this.conn)
            throw new Error('Database not initialized. Please call init() first.');

        //Fas o fetch do arquivo CSV
        const res = await fetch(`data/${this.filename}`);
        const buffer = new Uint8Array(await res.arrayBuffer());
        
        //Registra o arquivo na memória do DuckDB WASM
        await this.db.registerFileBuffer(this.filename, buffer);


        await this.conn.query(`
            CREATE TABLE ${this.table} AS
                SELECT * 
                FROM read_csv_auto('${this.filename}', header=true, all_varchar=1);
        `);
    }

    async query(sql) {
        if (!this.db || !this.conn)
            throw new Error('Database not initialized. Please call init() first.');

        const result = await this.conn.query(sql);
        return result.toArray().map(row => row.toJSON());
    }
}