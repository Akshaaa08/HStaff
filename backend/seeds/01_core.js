// Idempotent seed: skills (the 15 categories from the prototype), config defaults, admins, demo users.
const bcrypt = require('bcrypt');

const SKILLS = [
  'Cleaning', 'Cooking', 'Plumbing', 'Electrical', 'Carpentry', 'General Help', 'Service Staff', 'Security',
  'Driver', 'Delivery', 'Warehouse', 'Painting', 'AC Service', 'Appliance Repair', 'Welding',
];

const ids = {
  superAdmin: '00000000-0000-4000-8000-000000000001',
  verifier: '00000000-0000-4000-8000-000000000002',
  finance: '00000000-0000-4000-8000-000000000003',
  support: '00000000-0000-4000-8000-000000000004',
  client: '00000000-0000-4000-8000-000000000011',
  sunita: '00000000-0000-4000-8000-000000000021',
  rahul: '00000000-0000-4000-8000-000000000022',
  pending: '00000000-0000-4000-8000-000000000023',
};

exports.ids = ids;

exports.seed = async (knex) => {
  const prod = process.env.NODE_ENV === 'production';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || (prod ? '' : 'Admin@12345');
  if (prod && !adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD is required to seed in production');
  }
  const cost = process.env.NODE_ENV === 'test' ? 4 : 12;

  for (const name of SKILLS) {
    await knex('skills').insert({ name, active: true }).onConflict('name').ignore();
  }
  const skillId = async (name) => (await knex('skills').where({ name }).first('id')).id;

  // app_config defaults mirror the env defaults (admins can change them later)
  const cfg = {
    commission_pct: process.env.COMMISSION_PCT || '15',
    geofence_m: process.env.GEOFENCE_RADIUS_M || '150',
    request_ttl_min: process.env.REQUEST_TTL_MIN || '10',
    approval_sla_hours: process.env.APPROVAL_SLA_HOURS || '24',
  };
  for (const [key, value] of Object.entries(cfg)) {
    await knex('app_config').insert({ key, value }).onConflict('key').ignore();
  }

  const hash = await bcrypt.hash(adminPassword, cost);
  const admins = [
    [ids.superAdmin, 'super_admin', 'super@hstaff.dev', 'Super Admin'],
    [ids.verifier, 'verifier', 'verifier@hstaff.dev', 'Verifier'],
    [ids.finance, 'finance', 'finance@hstaff.dev', 'Finance'],
    [ids.support, 'support', 'support@hstaff.dev', 'Support'],
  ];
  for (const [id, admin_role, email, name] of admins) {
    await knex('users')
      .insert({ id, role: 'admin', admin_role, email, name, password_hash: hash })
      .onConflict('id')
      .ignore();
  }

  if (prod) return; // demo client and workers are for non-production environments only

  await knex('users')
    .insert({ id: ids.client, role: 'client', phone: '+919000000001', name: 'Akshaa' })
    .onConflict('id')
    .ignore();

  // Pune, Baner (lng, lat order for PostGIS)
  const workers = [
    { id: ids.sunita, phone: '+919000000002', name: 'Sunita Patil', skill: 'Cleaning', rate: 250, years: 8, lng: 73.7868, lat: 18.559,
      bio: 'A little care makes a house feel like home.', equipment: 'Cleaning kit, brushes and eco-friendly supplies', verification: 'APPROVED', online: true },
    { id: ids.rahul, phone: '+919000000003', name: 'Rahul Shinde', skill: 'Electrical', rate: 300, years: 6, lng: 73.7985, lat: 18.5642,
      bio: 'Reliable help for the little things and the big fixes.', equipment: 'Professional toolkit and safety equipment', verification: 'APPROVED', online: true },
    { id: ids.pending, phone: '+919000000004', name: 'Pending Worker', skill: 'Plumbing', rate: 280, years: 3, lng: 73.81, lat: 18.55,
      bio: 'Awaiting verification.', equipment: 'Basic plumbing tools', verification: 'PENDING', online: false },
  ];
  for (const w of workers) {
    await knex('users').insert({ id: w.id, role: 'worker', phone: w.phone, name: w.name }).onConflict('id').ignore();
    await knex.raw(
      `INSERT INTO worker_profiles (user_id, bio, experience_years, hourly_rate, equipment, is_online, location, location_updated_at, verification)
       VALUES (?, ?, ?, ?, ?, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, now(), ?)
       ON CONFLICT (user_id) DO NOTHING`,
      [w.id, w.bio, w.years, w.rate, w.equipment, w.online, w.lng, w.lat, w.verification],
    );
    await knex('worker_skills').insert({ worker_id: w.id, skill_id: await skillId(w.skill) }).onConflict(['worker_id', 'skill_id']).ignore();
  }
};
