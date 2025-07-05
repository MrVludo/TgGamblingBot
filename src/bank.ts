import sqlite3 from "sqlite3";
import { open } from "sqlite";

export class Bank {
    private db: any;

    async init() {
        this.db = await open({
            filename: './database/bank.db',
            driver: sqlite3.Database
        });
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS balances (
                chatId INTEGER PRIMARY KEY,
                balance INTEGER DEFAULT 0
            )
        `);
    }
    public async getBalance(chatId: number) {
        const dbUser = await this.db.get(
            'SELECT balance FROM balances WHERE chatId = ?', 
            [chatId]
        );
        return dbUser?.balance || 0;
    }
    public async setBalance(chatId: number, newBalance: number) {
        await this.db.run(
            'INSERT OR REPLACE INTO balances (chatId, balance) VALUES (?, ?)',
            [chatId, newBalance]
        );
    }
    public async changeBalance(chatId: number, change: number) {
        await this.db.run(
            'UPDATE balances SET balance = balance + ? WHERE chatId = ?',
            [change, chatId]
        );
    }
}