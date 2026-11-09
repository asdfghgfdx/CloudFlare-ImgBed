import { getDatabase } from '../../utils/databaseAdapter.js';

// 临时诊断端点 v2：分段定位 files 表写入/删除的真实限制
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || 'probe/tmp/' + Date.now() + '.txt';
  const out = { id };
  const db = getDatabase(env);

  const step = async (name, fn) => {
    try { const r = await fn(); out[name] = { ok: true, r: typeof r === 'object' ? JSON.stringify(r).slice(0,200) : String(r) }; }
    catch (e) { out[name] = { ok: false, err: String((e && e.message) || e).slice(0, 400) }; }
  };

  const tmpId = 'zz_probe/' + Date.now() + '.txt';
  await step('insertFiles', () => db.put(tmpId, '', { metadata: { FileName: 'p.txt', TimeStamp: Date.now(), Directory: 'zz_probe/' } }));
  await step('deleteFilesTmp', () => db.delete(tmpId));
  await step('insertSettings', () => db.put('manage@zzprobe@' + Date.now(), '1', {}));
  await step('deleteTarget', () => db.delete(id));

  return new Response(JSON.stringify(out, null, 1), { headers: { 'content-type': 'application/json' } });
}
