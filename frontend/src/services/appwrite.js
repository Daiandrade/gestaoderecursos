import { Client, Account, Databases, ID, Query, Permission, Role } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT)
  .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID;
export const COLLECTIONS = {
  PRODUCTS: process.env.REACT_APP_APPWRITE_PRODUCTS_COLLECTION,
  RESOURCES: process.env.REACT_APP_APPWRITE_RESOURCES_COLLECTION,
  EXPENSES: process.env.REACT_APP_APPWRITE_EXPENSES_COLLECTION,
  HISTORY: process.env.REACT_APP_APPWRITE_HISTORY_COLLECTION,
  USER_PROFILES: process.env.REACT_APP_APPWRITE_USER_PROFILES_COLLECTION
};

export { client, ID, Query, Permission, Role };
