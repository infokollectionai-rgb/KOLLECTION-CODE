const supabase = require('../database/supabase');

/**
 * requireAuth — verifies the Bearer JWT, fetches the company profile,
 * and attaches req.user and req.company to the request.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7).trim();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { data: company, error: companyError } = await supabase
      .from('client_companies')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (companyError || !company) {
      return res.status(401).json({ error: 'Company profile not found for this user' });
    }

    req.user = user;
    req.company = company;
    next();
  } catch (err) {
    console.error('requireAuth error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * requireAdmin — runs requireAuth first, then enforces admin role.
 */
async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.company?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
