import {
  buildBolt11PayUri,
  buildLightningPayUri,
  buildPayComment,
  buildZbdPayUrl,
  buildWalletOpenUrl,
  parseLightningAddress,
  satsToMillisats,
} from '../src/lightningPay.ts';

const base = {
  method: 'zbd',
  zbdGamerTag: 'testuser',
  amountSats: 1000,
  memo: 'hello',
  username: 'vaultuser',
  paymentId: 'test-123',
};

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed++;
  } else {
    console.log('OK:', msg);
  }
}

assert(satsToMillisats(1000) === 1_000_000, 'millisats conversion');
assert(parseLightningAddress('user@zbd.gg')?.domain === 'zbd.gg', 'parse lightning address');

for (const mode of ['tip', 'send', 'request']) {
  const opts = { ...base, mode };
  const uri = buildLightningPayUri(opts);
  assert(uri.includes('user%40zbd.gg'), `${mode}: encodes @ in address`);
  assert(uri.includes('amount=1000000'), `${mode}: amount in millisats`);
  assert(buildPayComment(opts).includes('LV-' + mode), `${mode}: payment reference`);
  const zbdWeb = buildZbdPayUrl(opts);
  assert(zbdWeb === 'https://zbd.gg/testuser?amount=1000&comment=hello', `${mode}: zbd web url`);
  assert(buildLightningPayUri(opts).startsWith('lightning:'), `${mode}: lightning fallback uri`);
}

assert(buildZbdPayUrl({ ...base, mode: 'tip' }).startsWith('https://zbd.gg/'), 'desktop zbd web url');

const alby = {
  method: 'alby',
  albyAddress: 'user@getalby.com',
  amountSats: 500,
  mode: 'tip',
  username: 'vaultuser',
  paymentId: 'alby-1',
};
assert(buildLightningPayUri(alby).includes('user%40getalby.com'), 'alby address encoded');
assert(buildWalletOpenUrl(alby).includes('lightning:'), 'alby wallet url');
assert(buildBolt11PayUri('lnbc10u1ptest') === 'lightning:lnbc10u1ptest', 'bolt11 uri');

console.log(failed ? `\n${failed} assertion(s) failed` : '\nAll assertions passed');
process.exit(failed ? 1 : 0);
