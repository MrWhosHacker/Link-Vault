/** Lightning Address / LUD-06 helpers for Tip · Send · Request flows */

export type PayMethod = 'zbd' | 'alby';

export type PaymentMode = 'tip' | 'send' | 'request';

export interface LightningPayOptions {
  method: PayMethod;
  zbdGamerTag?: string;
  albyAddress?: string;
  amountSats?: number;
  memo?: string;
  mode?: PaymentMode;
  username?: string;
  /** Unique id so each QR / wallet open is distinct */
  paymentId?: string;
}

interface LnurlPayMetadata {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  tag: string;
  commentAllowed?: number;
  status?: string;
  reason?: string;
}

interface LnurlInvoiceResponse {
  pr: string;
  status?: string;
  reason?: string;
}

/** LUD-06: amount query param is millisatoshis */
export function satsToMillisats(sats: number): number {
  const n = Math.floor(Number(sats));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n * 1000;
}

export function resolveLightningAddress(opts: Pick<LightningPayOptions, 'method' | 'zbdGamerTag' | 'albyAddress'>): string {
  if (opts.method === 'zbd' && opts.zbdGamerTag?.trim()) {
    const tag = opts.zbdGamerTag.trim().replace(/@zbd\.gg$/i, '');
    return `${tag}@zbd.gg`;
  }
  const alby = opts.albyAddress?.trim() ?? '';
  return alby.replace(/^lightning:/i, '');
}

export function buildPaymentReference(opts: Pick<LightningPayOptions, 'mode' | 'username' | 'paymentId'>): string {
  const mode = opts.mode ?? 'tip';
  const user = opts.username?.trim() || 'vault';
  const id = opts.paymentId ?? String(Date.now());
  return `LV-${mode}-${user}-${id}`;
}

export function buildPayComment(opts: LightningPayOptions): string {
  const ref = buildPaymentReference(opts);
  const modeLabel = opts.mode === 'send' ? 'Send' : opts.mode === 'request' ? 'Request' : 'Tip';
  const userLabel = opts.username ? `@${opts.username}` : 'LinkVault';
  const customMemo = opts.memo?.trim();
  return customMemo
    ? `${customMemo} - ${ref}`
    : `${modeLabel} ${userLabel} - ${ref}`;
}

export function parseLightningAddress(address: string): { username: string; domain: string } | null {
  const clean = address.trim().replace(/^lightning:/i, '').split('?')[0];
  const at = clean.lastIndexOf('@');
  if (at <= 0) return null;
  const username = clean.slice(0, at);
  const domain = clean.slice(at + 1);
  if (!username || !domain) return null;
  return { username, domain };
}

/** LUD-16 LNURL-pay: resolve a BOLT11 invoice for a fixed amount (best QR compatibility). */
export async function fetchLightningInvoice(
  address: string,
  amountSats: number,
  comment?: string,
): Promise<string> {
  const parsed = parseLightningAddress(address);
  if (!parsed) throw new Error('Invalid lightning address');

  const ms = satsToMillisats(amountSats);
  if (ms <= 0) throw new Error('Amount must be greater than zero');

  const lookupUrl = `https://${parsed.domain}/.well-known/lnurlp/${encodeURIComponent(parsed.username)}`;
  const metaRes = await fetch(lookupUrl);
  if (!metaRes.ok) throw new Error('LNURL lookup failed');

  const meta = (await metaRes.json()) as LnurlPayMetadata;
  if (meta.status === 'ERROR') throw new Error(meta.reason ?? 'LNURL error');
  if (meta.tag !== 'payRequest' || !meta.callback) throw new Error('Unsupported LNURL response');

  if (ms < meta.minSendable || ms > meta.maxSendable) {
    throw new Error('Amount out of allowed range');
  }

  const callbackUrl = new URL(meta.callback);
  callbackUrl.searchParams.set('amount', String(ms));

  const trimmedComment = comment?.trim();
  if (trimmedComment && meta.commentAllowed && meta.commentAllowed > 0) {
    callbackUrl.searchParams.set('comment', trimmedComment.slice(0, meta.commentAllowed));
  }

  const invRes = await fetch(callbackUrl.toString());
  if (!invRes.ok) throw new Error('Invoice request failed');

  const inv = (await invRes.json()) as LnurlInvoiceResponse;
  if (inv.status === 'ERROR' || !inv.pr) throw new Error(inv.reason ?? 'Invoice error');

  return inv.pr.trim();
}

export function buildBolt11PayUri(invoice: string): string {
  const trimmed = invoice.trim();
  if (!trimmed) return '';
  return trimmed.toLowerCase().startsWith('lightning:') ? trimmed : `lightning:${trimmed}`;
}

/** Lightning-address URI fallback (LUD-06) — @ must be percent-encoded for wallet parsers. */
export function buildLightningPayUri(opts: LightningPayOptions): string {
  const address = resolveLightningAddress(opts);
  if (!address) return '';

  const params = new URLSearchParams();
  const ms = opts.amountSats ? satsToMillisats(opts.amountSats) : 0;
  if (ms > 0) params.set('amount', String(ms));

  params.set('message', buildPayComment(opts).slice(0, 240));

  const encodedAddress = encodeURIComponent(address);
  const q = params.toString();
  return q ? `lightning:${encodedAddress}?${q}` : `lightning:${encodedAddress}`;
}

export function normalizeZbdGamertag(gamertag: string): string {
  return gamertag.trim().replace(/@zbd\.gg$/i, '');
}

/** ZBD web profile with optional amount + comment (desktop "Open in ZBD"). */
export function buildZbdPayUrl(opts: Pick<LightningPayOptions, 'zbdGamerTag' | 'amountSats' | 'memo'>): string {
  const tag = normalizeZbdGamertag(opts.zbdGamerTag ?? '');
  if (!tag) return '';

  const base = `https://zbd.gg/${encodeURIComponent(tag)}`;
  const params = new URLSearchParams();
  const sats = Math.floor(Number(opts.amountSats) || 0);
  if (sats > 0) params.set('amount', String(sats));

  const memo = opts.memo?.trim();
  if (memo) params.set('comment', memo.slice(0, 150));

  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

/** Mobile: lightning/BOLT11 deep link. Desktop: zbd.gg with amount. */
export function buildZbdOpenUrl(opts: LightningPayOptions, bolt11Invoice?: string): string {
  if (bolt11Invoice) return buildBolt11PayUri(bolt11Invoice);
  if (isMobileDevice()) {
    const lightning = buildLightningPayUri(opts);
    return lightning || buildZbdPayUrl(opts);
  }
  return buildZbdPayUrl(opts);
}

export function buildWalletOpenUrl(opts: LightningPayOptions, bolt11Invoice?: string): string {
  if (bolt11Invoice) return buildBolt11PayUri(bolt11Invoice);
  if (opts.method === 'zbd' && opts.zbdGamerTag?.trim()) {
    return buildZbdOpenUrl(opts);
  }
  return buildLightningPayUri(opts);
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function openInWalletApp(uri: string): void {
  if (!uri) return;
  const a = document.createElement('a');
  a.href = uri;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function openExternalUrl(url: string): void {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function resolvePayMethod(
  enableZBD: boolean,
  enableAlby: boolean,
  zbdGamerTag?: string,
  albyAddress?: string,
): PayMethod | null {
  if (enableZBD && zbdGamerTag?.trim()) return 'zbd';
  if (enableAlby && albyAddress?.trim()) return 'alby';
  return null;
}
