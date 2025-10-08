import { AnalysisResult } from '../types';

let db: IDBDatabase | null = null;
const STORE_NAME = 'analysisReports';
const DB_NAME = 'SwasthyaSenseDB_Default';
const DB_VERSION = 1;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(true);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening database');
      reject(false);
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      console.log('Database initialized successfully');
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const tempDb = (event.target as IDBOpenDBRequest).result;
      if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
        tempDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const addReport = (report: AnalysisResult): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(report); // Use put to allow overwriting if needed

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error('Error adding report:', request.error);
      reject(request.error);
    };
  });
};

export const getAllReports = (): Promise<AnalysisResult[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.warn('DB not initialized, returning empty array.');
      resolve([]);
      return;
    }
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('Error getting all reports:', request.error);
      reject(request.error);
    };
  });
};