import { Message, Role } from '@/utils/Interfaces';
import { type SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 2;
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion === 0) {
    // Check if tables already exist before creating
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('chats', 'messages')"
    );

    const tableNames = tables.map((t) => t.name);
    if (!tableNames.includes('chats')) {
      await db.execAsync(`
        CREATE TABLE chats (
          id INTEGER PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          thread_id TEXT
        );
      `);
    }

    if (!tableNames.includes('messages')) {
      await db.execAsync(`
        CREATE TABLE messages (
          id INTEGER PRIMARY KEY NOT NULL,
          chat_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          imageUrl TEXT,
          role TEXT,
          prompt TEXT,
          FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
        );
      `);
    }

    currentDbVersion = 1;
  }

  if (currentDbVersion === 1) {
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(chats)');
    const hasThreadId = columns.some((col) => col.name === 'thread_id');
    if (!hasThreadId) {
      await db.execAsync(`ALTER TABLE chats ADD COLUMN thread_id TEXT`);
    }
    currentDbVersion = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}



export const addChat = async (db: SQLiteDatabase, title: string, threadId?: string) => {
  return await db.runAsync(
    'INSERT INTO chats (title, thread_id) VALUES (?, ?)',
    title,
    threadId ?? null
  );
};

export const getChats = async (db: SQLiteDatabase) => {
  return await db.getAllAsync('SELECT * FROM chats ORDER BY id DESC');
};

export const getMessages = async (db: SQLiteDatabase, chatId: number): Promise<Message[]> => {
  return (await db.getAllAsync<Message>('SELECT * FROM messages WHERE chat_id = ?', chatId)).map(
    (message) => ({
      ...message,
      role: '' + message.role === 'bot' ? Role.Bot : Role.User,
    })
  );
};

export const addMessage = async (
  db: SQLiteDatabase,
  chatId: number,
  { content, role, imageUrl, prompt }: Message
) => {
  return await db.runAsync(
    'INSERT INTO messages (chat_id, content, role, imageUrl, prompt) VALUES (?, ?, ?, ?, ?)',
    chatId,
    content,
    role === Role.Bot ? 'bot' : 'user',
    imageUrl || '',
    prompt || ''
  );
};

export const deleteChat = async (db: SQLiteDatabase, chatId: number) => {
  return await db.runAsync('DELETE FROM chats WHERE id = ?', chatId);
};

export const renameChat = async (db: SQLiteDatabase, chatId: number, title: string) => {
  return await db.runAsync('UPDATE chats SET title = ? WHERE id = ?', title, chatId);
};
