import { getDatabase } from '../../utils/databaseAdapter.js';

// 临时诊断端点：返回 deleteFile 内部真实异常（排查完成后删除）
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const fileId = url.searchParams.get('id');
  const out = { fileId };
  if (!fileId) return new Response(JSON.stringify({ error: 'id required' }), { headers: { 'content-type': 'application/json' } });

  const db = getDatabase(env);
  try {
    const r = await db.getWithMetadata(fileId);
    out.record = r ? { hasValue: !!r.value, hasMeta: !!r.metadata, channel: r.metadata && r.metadata.Channel } : null;
  } catch (e) { out.getErr = String((e && e.stack) || e).slice(0, 800); }

  try { await db.delete(fileId); out.deleted = true; }
  catch (e) { out.deleted = false; out.delErr = String((e && e.stack) || e).slice(0, 1200); }

  return new Response(JSON.stringify(out, null, 1), { headers: { 'content-type': 'application/json' } });
}
