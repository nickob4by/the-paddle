import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'libsql://the-paddle-nickob4by.aws-ap-southeast-2.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTE4OTU2NDUsImlkIjoiMDFhMTM1NGQtM2MwMS03YWJlLWI4YjYtNzllMzFlNTQ4ZDNhIiwia2lkIjoieWxINzc1VTRHZmVCTG1vLW1CZ1dxcXVXalk4VFBQWnR0VWN5RmN5czhzQSIsInJpZCI6ImUxNmU2NmI4LTM4OTgtNGIzZC04ZTg2LWZmMTFkYjQyZTA1YyJ9.qV0ShUL4-rNCubECONftFdkbYveQ3ViQqzyy-fz2S5YyWe9S9DZjgymG-oDuaT24y7QXIEzY32AjCZ9umqo-Dw';

// Create LibSQL client that runs seamlessly on Vercel Serverless & Edge
const db = createClient({
  url,
  authToken
});

export default db;
