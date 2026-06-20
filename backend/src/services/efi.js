import https from 'https';

const EFI_BASE = process.env.EFI_BASE || 'https://pix.api.efipay.com.br';
const EFI_SANDBOX_BASE = 'https://pix-h.api.efipay.com.br';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getToken(clientId, clientSecret, sandbox) {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const base = sandbox ? EFI_SANDBOX_BASE : EFI_BASE;
  const body = JSON.stringify({ grant_type: 'client_credentials' });
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const resp = await fetch(`${base}/oauth/token`, {
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

// Generate PIX QR code
export async function generatePix(wedding, amount, txid) {
  const clientId = wedding.efiClientId || process.env.EFI_CLIENT_ID;
  const clientSecret = wedding.efiClientSecret || process.env.EFI_CLIENT_SECRET;
  const pixKey = wedding.efiPixKey || process.env.EFI_PIX_KEY;
  const sandbox = wedding.efiSandbox !== false;

  if (!clientId || !clientSecret || !pixKey) {
    throw new Error('EFI Pay não configurado. Configure no painel admin.');
  }

  const token = await getToken(clientId, clientSecret, sandbox);
  const base = sandbox ? EFI_SANDBOX_BASE : EFI_BASE;

  const body = JSON.stringify({
    calendario: { expiracao: 3600 },
    devedor: { nome: 'Convidado' },
    valor: { original: amount.toFixed(2) },
    chave: pixKey,
    txid,
  });

  const resp = await fetch(`${base}/v2/cob/${txid}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body,
  });

  const data = await resp.json();

  // Generate QR code
  if (data.loc?.id) {
    const qrResp = await fetch(`${base}/v2/loc/${data.loc.id}/qrcode`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const qrData = await qrResp.json();
    return {
      txid,
      pixCode: data.pixCopiaECola || '',
      qrcode: qrData.imagemQrcode || '',
      expiresAt: data.calendario?.criacao ? new Date(new Date(data.calendario.criacao).getTime() + 3600000).toISOString() : null,
    };
  }

  throw new Error(data.error || 'Falha ao gerar PIX');
}

// Check PIX payment status
export async function checkPixStatus(wedding, txid) {
  const clientId = wedding.efiClientId || process.env.EFI_CLIENT_ID;
  const clientSecret = wedding.efiClientSecret || process.env.EFI_CLIENT_SECRET;
  const sandbox = wedding.efiSandbox !== false;

  const token = await getToken(clientId, clientSecret, sandbox);
  const base = sandbox ? EFI_SANDBOX_BASE : EFI_BASE;

  const resp = await fetch(`${base}/v2/cob/${txid}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const data = await resp.json();
  return {
    status: data.status, // ATIVA, CONCLUIDA, REMOVIDA_PELO_USUARIO_RECEBEDOR, REMOVIDA_PELO_PSP
    txid: data.txid,
    paidAt: data.historico?.find(h => h.status === 'CONCLUIDA')?.horario || null,
  };
}
