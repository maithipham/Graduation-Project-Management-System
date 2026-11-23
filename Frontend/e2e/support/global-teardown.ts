import { closeDb } from './db';

export default async function globalTeardown() {
  await closeDb();
}
