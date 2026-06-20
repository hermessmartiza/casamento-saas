import https from 'https';
import fs from 'fs';
import path from 'path';

const EFI_BASE = 'https://pix.api.efipay.com.br';
const EFI_SANDBOX_BASE = 'https://pix-h.api.efipay.com.br';

let cachedToken = null;
let tokenExpiresAt = 0;

function getCertPath(weddingId) {
  const certDir = process.env.CERTS_DIR || '/app/certs';
  return path.join(certDir, `${weddingId}.p12`);
}

function certExists(weddingId) {
  return fs.existsSync(getCertPath(weddingId));
}

async function getToken(clientId, clientSecret, weddingId, sandbox) {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const url = sandbox ? EFI_SANDBOX_BASE : EFI_BASE;
  const body = JSON.stringify({ grant_type: 'client_credentials' });
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const resp = await fetch(`${url}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body,
  });

  const data = await resp.json();
  if (data.error) throw new Error(`EFI auth failed: ${data.error_description || data.error}`);

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

function efifetch(url, options, weddingId, sandbox) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOpts = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      rejectUnauthorized: true,
    };

    // Use certificate for non-sandbox
    if (!sandbox && certExists(weddingId)) {
      reqOpts.pfx = fs.readFileSync(getCertPath(weddingId));
      reqOpts.passphrase = '';
    }

    const req = https.request(reqOpts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

export async function generatePix(wedding, amount, txid) {
  const clientId = wedding.efiClientId || process.env.EFI_CLIENT_ID;
  const clientSecret = wedding.efiClientSecret || process.env.EFI_CLIENT_SECRET;
  const pixKey = wedding.efiPixKey || process.env.EFI_PIX_KEY;
  const sandbox = wedding.efiSandbox !== false;

  if (!clientId || !clientSecret || !pixKey) {
    throw new Error('EFI Pay não configurado. Configure no painel admin.');
  }

  if (!sandbox && !certExists(wedding.id)) {
    throw new Error('Certificado .p12 não encontrado. Faça upload no painel admin.');
  }

  const token = await getToken(clientId, clientSecret, wedding.id, sandbox);
  const base = sandbox ? EFI_SANDBOX_BASE : EFI_BASE;

  const body = JSON.stringify({
    calendario: { expiracao: 3600 },
    devedor: { nome: 'Convidado' },
    valor: { original: amount.toFixed(2) },
    chave: pixKey,
    txid,
  });

  const resp = await efifetch(`${base}/v2/cob/${txid}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body,
  }, wedding.id, sandbox);

  if (resp.status >= 400) throw new Error(resp.data?.error || `EFI error ${resp.status}`);

  const data = resp.data;
  if (data.loc?.id) {
    const qrResp = await efifetch(`${base}/v2/loc/${data.loc.id}/qrcode`, {
      headers: { 'Authorization': `Bearer ${token}` },
    }, wedding.id, sandbox);
    return {
      txid,
      pixCode: data.pixCopiaECola || '',
      qrcode: qrResp.data?.imagemQrcode || '',
      expiresAt: data.calendario?.criacao
        ? new Date(new Date(data.calendario.criacao).getTime() + 3600000).toISOString()
        : null,
    };
  }

  throw new Error('Falha ao gerar QR code PIX');
}

export async function checkPixStatus(wedding, txid) {
  const clientId = wedding.efiClientId || process.env.EFI_CLIENT_ID;
  const clientSecret = wedding.efiClientSecret || process.env.EFI_CLIENT_SECRET;
  const sandbox = wedding.efiSandbox !== false;

  const token = await getToken(clientId, clientSecret, wedding.id, sandbox);
  const base = sandbox ? EFI_SANDBOX_BASE : EFI_BASE;

  const resp = await efifetch(`${base}/v2/cob/${txid}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  }, wedding.id, sandbox);

  const data = resp.data || {};
  return {
    status: data.status,
    txid: data.txid,
    paidAt: (data.historico || []).find(h => h.status === 'CONCLUIDA')?.horario || null,
  };
}

export { certExists };
