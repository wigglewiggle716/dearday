const { getSupabaseAdmin } = require('../lib/supabase-admin');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('categories').select('id', { head: true, count: 'exact' }).limit(1);
    if (error) throw error;

    return res.status(200).json({
      ok: true,
      service: 'dear-day-backend',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      service: 'dear-day-backend',
      database: 'unavailable',
      error: process.env.NODE_ENV === 'production' ? 'Backend configuration incomplete' : String(error.message || error),
    });
  }
};
