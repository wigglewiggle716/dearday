const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hpffdmldtdtwcaoemyso.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_10ZXpBIQH2bG-iseG7jpdw_DfmEUT_C';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { error } = await supabase
      .from('categories')
      .select('id', { head: true, count: 'exact' })
      .limit(1);

    if (error) throw error;

    return res.status(200).json({
      ok: true,
      service: 'dear-day-backend',
      database: 'connected',
      auth_client: 'publishable-key',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      service: 'dear-day-backend',
      database: 'unavailable',
      error: process.env.NODE_ENV === 'production' ? 'Backend connection failed' : String(error.message || error),
    });
  }
};
