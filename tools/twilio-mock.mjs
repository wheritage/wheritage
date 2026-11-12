// Twilio simulé pour les tests locaux (tools/dev-server.mjs, tools/test-leads.mjs).
// Remplace globalThis.fetch pour lookups.twilio.com et verify.twilio.com ; tout le reste passe.
// Numéros spéciaux : 514 700-0000 → nonFixedVoip (Google Voice), 514 700-0001 → ligne inactive,
// 514 700-0002 → fixedVoip, 514 700-0003 → SMS pumping élevé. Le bon code est toujours 123456.
export function installTwilioMock() {
  process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'ACmock';
  process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'mock';
  process.env.TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID || 'VAmock';
  const real = globalThis.fetch;
  const pending = new Map();
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  globalThis.fetch = async (url, opt = {}) => {
    const u = String(url);
    if (u.startsWith('https://lookups.twilio.com/v2/PhoneNumbers/')) {
      const num = decodeURIComponent(u.split('/PhoneNumbers/')[1].split('?')[0]);
      const special = { '+15147000000': 'nonFixedVoip', '+15147000002': 'fixedVoip' };
      return json(200, { phone_number: num, valid: true,
        line_type_intelligence: { type: special[num] || 'mobile', carrier_name: special[num] ? 'Google (Grand Central) - SVR' : 'Bell Mobility' },
        line_status: { status: num === '+15147000001' ? 'inactive' : 'active' },
        sms_pumping_risk: { carrier_risk_category: num === '+15147000003' ? 'high' : 'low', number_blocked: false, sms_pumping_risk_score: num === '+15147000003' ? 92 : 3 } });
    }
    if (/^https:\/\/verify\.twilio\.com\/v2\/Services\/[^/]+\/Verifications$/.test(u)) {
      const f = new URLSearchParams(opt.body); pending.set(f.get('To'), Date.now());
      return json(201, { sid: 'VEmock', to: f.get('To'), channel: f.get('Channel'), status: 'pending' });
    }
    if (/^https:\/\/verify\.twilio\.com\/v2\/Services\/[^/]+\/VerificationCheck$/.test(u)) {
      const f = new URLSearchParams(opt.body);
      if (!pending.has(f.get('To'))) return json(404, { code: 20404, message: 'The requested resource was not found' });
      const ok = f.get('Code') === '123456';
      if (ok) pending.delete(f.get('To'));
      return json(200, { to: f.get('To'), channel: 'sms', status: ok ? 'approved' : 'pending', valid: ok });
    }
    return real(url, opt);
  };
}
