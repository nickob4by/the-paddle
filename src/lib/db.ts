const rawUrl = process.env.TURSO_DATABASE_URL || 'libsql://the-paddle-nickob4by.aws-ap-southeast-2.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTE4OTU2NDUsImlkIjoiMDFhMTM1NGQtM2MwMS03YWJlLWI4YjYtNzllMzFlNTQ4ZDNhIiwia2lkIjoieWxINzc1VTRHZmVCTG1vLW1CZ1dxcXVXalk4VFBQWnR0VWN5RmN5czhzQSIsInJpZCI6ImUxNmU2NmI4LTM4OTgtNGIzZC04ZTg2LWZmMTFkYjQyZTA1YyJ9.qV0ShUL4-rNCubECONftFdkbYveQ3ViQqzyy-fz2S5YyWe9S9DZjgymG-oDuaT24y7QXIEzY32AjCZ9umqo-Dw';

// Convert libsql:// to https://
const httpUrl = rawUrl.replace(/^libsql:\/\//, 'https://');

export interface DbExecuteResult {
  rows: any[];
  rowsAffected: number;
}

function formatValue(arg: any): any {
  if (arg === null || arg === undefined) return { type: 'null' };
  if (typeof arg === 'number') {
    return Number.isInteger(arg)
      ? { type: 'integer', value: String(arg) }
      : { type: 'float', value: arg };
  }
  if (typeof arg === 'boolean') {
    return { type: 'integer', value: arg ? '1' : '0' };
  }
  return { type: 'text', value: String(arg) };
}

export async function execute(query: string | { sql: string; args?: any[] }): Promise<DbExecuteResult> {
  const sql = typeof query === 'string' ? query : query.sql;
  const rawArgs = typeof query === 'string' ? [] : (query.args || []);
  const formattedArgs = rawArgs.map(formatValue);

  const payload = {
    requests: [
      {
        type: 'execute',
        stmt: {
          sql,
          args: formattedArgs
        }
      },
      {
        type: 'close'
      }
    ]
  };

  const response = await fetch(`${httpUrl}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Turso HTTP Error (${response.status}): ${errText}`);
  }

  const data = await response.json() as any;
  const execResult = data?.results?.[0]?.response?.result;

  if (!execResult) {
    return { rows: [], rowsAffected: 0 };
  }

  const columns = (execResult.cols || []).map((c: any) => c.name);
  const rows = (execResult.rows || []).map((row: any[]) => {
    const obj: Record<string, any> = {};
    row.forEach((cell: any, index: number) => {
      const colName = columns[index];
      if (cell.type === 'null') {
        obj[colName] = null;
      } else if (cell.type === 'integer') {
        const num = Number(cell.value);
        obj[colName] = Number.isNaN(num) ? cell.value : num;
      } else if (cell.type === 'float') {
        obj[colName] = cell.value;
      } else {
        obj[colName] = cell.value;
      }
    });
    return obj;
  });

  return {
    rows,
    rowsAffected: execResult.affected_row_count || 0
  };
}

export async function executeBatch(
  statements: Array<string | { sql: string; args?: any[] }>
): Promise<DbExecuteResult[]> {
  const requests: any[] = statements.map((item) => {
    const sql = typeof item === 'string' ? item : item.sql;
    const rawArgs = typeof item === 'string' ? [] : (item.args || []);
    return {
      type: 'execute',
      stmt: {
        sql,
        args: rawArgs.map(formatValue)
      }
    };
  });

  // Always close connection pipeline
  requests.push({ type: 'close' });

  const response = await fetch(`${httpUrl}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Turso HTTP Error (${response.status}): ${errText}`);
  }

  const data = await response.json() as any;
  const results: DbExecuteResult[] = [];

  for (let i = 0; i < statements.length; i++) {
    const resItem = data?.results?.[i];
    if (resItem?.type === 'error') {
      throw new Error(`Turso Query Error: ${resItem.error?.message || 'Unknown database error'}`);
    }

    const execResult = resItem?.response?.result;
    if (!execResult) {
      results.push({ rows: [], rowsAffected: 0 });
      continue;
    }

    const columns = (execResult.cols || []).map((c: any) => c.name);
    const rows = (execResult.rows || []).map((row: any[]) => {
      const obj: Record<string, any> = {};
      row.forEach((cell: any, index: number) => {
        const colName = columns[index];
        if (cell.type === 'null') {
          obj[colName] = null;
        } else if (cell.type === 'integer') {
          const num = Number(cell.value);
          obj[colName] = Number.isNaN(num) ? cell.value : num;
        } else if (cell.type === 'float') {
          obj[colName] = cell.value;
        } else {
          obj[colName] = cell.value;
        }
      });
      return obj;
    });

    results.push({
      rows,
      rowsAffected: execResult.affected_row_count || 0
    });
  }

  return results;
}

const db = { execute, executeBatch };
export default db;
