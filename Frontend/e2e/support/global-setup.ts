import { chromium, request, type FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const e2eRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(e2eRoot, '.env.e2e') });

const ROLE_ENV_MAP: Record<string, string> = {
  admin: 'E2E_EMAIL_ADMIN',
  head_of_major: 'E2E_EMAIL_HEAD_OF_MAJOR',
  supervisor: 'E2E_EMAIL_SUPERVISOR',
  examiner: 'E2E_EMAIL_EXAMINER',
  commenting_lecturer: 'E2E_EMAIL_COMMENTING_LECTURER',
  secretary: 'E2E_EMAIL_SECRETARY',
  chairperson: 'E2E_EMAIL_CHAIRPERSON',
  council_member: 'E2E_EMAIL_COUNCIL_MEMBER',
  student: 'E2E_EMAIL_STUDENT',
};

export default async function globalSetup(_config: FullConfig) {
  const authDir = path.join(e2eRoot, '.auth');
  fs.mkdirSync(authDir, { recursive: true });

  const rawApiUrl = (process.env.E2E_API_URL || 'http://localhost:8080/gpms').replace(/\/+$/, '');
  const apiUrlObj = new URL(rawApiUrl);
  const apiDomain = apiUrlObj.hostname;

  const apiContext = await request.newContext();
  const browser = await chromium.launch();

  try {
    for (const [roleKey, envName] of Object.entries(ROLE_ENV_MAP)) {
      const email = process.env[envName]?.trim();
      const authFile = path.join(authDir, `${roleKey}.json`);

      if (!email) {
        fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }, null, 2), 'utf8');
        continue;
      }

      const res = await apiContext.post(`${rawApiUrl}/login-postman`, {
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        data: email,
      });

      if (!res.ok()) {
        console.warn(`[global-setup] Không thể đăng nhập role "${roleKey}" (HTTP ${res.status()})`);
        fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }, null, 2), 'utf8');
        continue;
      }

      const body = await res.json();
      const token: string | undefined = body?.data?.token;
      if (!token) {
        console.warn(`[global-setup] Phản hồi /login-postman cho role "${roleKey}" không có token`);
        fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }, null, 2), 'utf8');
        continue;
      }

      const context = await browser.newContext();
      await context.addCookies([
        {
          name: 'access_token',
          value: token,
          domain: apiDomain,
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ]);
      await context.storageState({ path: authFile });
      await context.close();
    }
  } finally {
    await browser.close();
    await apiContext.dispose();
  }
}
