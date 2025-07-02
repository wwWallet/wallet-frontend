import test from 'ava'
import * as crypto from 'crypto'

import { GeneralSign, generalVerify } from '../../src/index.js'

test.before(async (t) => {
  const encode = TextEncoder.prototype.encode.bind(new TextEncoder())
  t.context.plaintext = encode('It’s a dangerous business, Frodo, going out your door.')
  t.context.secret = crypto.randomFillSync(new Uint8Array(48))
})

test('General JWS signing', async (t) => {
  const generalJws = await new GeneralSign(t.context.plaintext)
    .addSignature(t.context.secret)
    .setProtectedHeader({ bar: 'baz' })
    .setUnprotectedHeader({ alg: 'HS256' })
    .addSignature(t.context.secret)
    .setProtectedHeader({ bar: 'baz' })
    .setUnprotectedHeader({ alg: 'HS384' })
    .sign()

  t.is(
    generalJws.payload,
    'SXTigJlzIGEgZGFuZ2Vyb3VzIGJ1c2luZXNzLCBGcm9kbywgZ29pbmcgb3V0IHlvdXIgZG9vci4',
  )
  t.is(generalJws.signatures.length, 2)
})

test('General JWS signing b64:false', async (t) => {
  const generalJws = await new GeneralSign(t.context.plaintext)
    .addSignature(t.context.secret)
    .setProtectedHeader({ bar: 'baz', b64: false, crit: ['b64'] })
    .setUnprotectedHeader({ alg: 'HS256' })
    .addSignature(t.context.secret)
    .setProtectedHeader({ bar: 'baz', b64: false, crit: ['b64'] })
    .setUnprotectedHeader({ alg: 'HS384' })
    .sign()

  t.is(generalJws.payload, '')
  t.is(generalJws.signatures.length, 2)
})

test('General JWS signing validations', async (t) => {
  const sig = new GeneralSign(t.context.plaintext)

  t.throws(
    () => {
      sig
        .addSignature(t.context.secret)
        .setProtectedHeader({ bar: 'baz', crit: ['b64'], b64: false, alg: 'HS256' })
        .setProtectedHeader({ bar: 'baz', crit: ['b64'], b64: false, alg: 'HS256' })
    },
    { instanceOf: TypeError, message: 'setProtectedHeader can only be called once' },
  )

  t.throws(
    () => {
      sig
        .addSignature(t.context.secret)
        .setProtectedHeader({ bar: 'baz', crit: ['b64'], b64: true, alg: 'HS384' })
        .setUnprotectedHeader({ foo: 'bar' })
        .setUnprotectedHeader({ foo: 'bar' })
    },
    { instanceOf: TypeError, message: 'setUnprotectedHeader can only be called once' },
  )

  await t.throwsAsync(sig.sign(), {
    message: 'inconsistent use of JWS Unencoded Payload (RFC7797)',
    code: 'ERR_JWS_INVALID',
  })
})

test('General JWS verify format validation', async (t) => {
  const sig = new GeneralSign(t.context.plaintext)

  sig
    .addSignature(t.context.secret)
    .setProtectedHeader({ bar: 'baz' })
    .setUnprotectedHeader({ alg: 'HS256' })

  const generalJws = await sig.sign()

  {
    await t.notThrowsAsync(async () => {
      await generalVerify(
        await new GeneralSign(new Uint8Array())
          .addSignature(t.context.secret)
          .setProtectedHeader({ alg: 'HS256' })
          .sign(),
        t.context.secret,
      )
    })
  }

  {
    await t.throwsAsync(generalVerify(null, t.context.secret), {
      message: 'General JWS must be an object',
      code: 'ERR_JWS_INVALID',
    })
  }

  {
    await t.throwsAsync(generalVerify({ signatures: null }, t.context.secret), {
      message: 'JWS Signatures missing or incorrect type',
      code: 'ERR_JWS_INVALID',
    })
  }

  {
    await t.throwsAsync(generalVerify({ signatures: [null] }, t.context.secret), {
      message: 'JWS Signatures missing or incorrect type',
      code: 'ERR_JWS_INVALID',
    })
  }

  {
    const jws = { payload: generalJws.payload, signatures: [] }

    await t.throwsAsync(generalVerify(jws, t.context.secret), {
      message: 'signature verification failed',
      code: 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
    })
  }

  {
    await t.notThrowsAsync(generalVerify(generalJws, t.context.secret))
  }

  {
    const { payload, signatures } = generalJws
    const jws = { payload, signatures: [...signatures, {}] }

    await t.notThrowsAsync(generalVerify(jws, t.context.secret))
  }

  {
    const { payload, signatures } = generalJws
    const jws = { payload, signatures: [{}, ...signatures] }

    await t.notThrowsAsync(generalVerify(jws, t.context.secret))
  }
})

test('sign empty data', async (t) => {
  const jws = await new GeneralSign(new Uint8Array(0))
    .addSignature(new Uint8Array(32))
    .setProtectedHeader({ alg: 'HS256' })
    .sign()

  t.is(jws.payload, '')

  const { payload } = await generalVerify(jws, new Uint8Array(32))
  t.is(payload.byteLength, 0)
})

test('sign using custom SignFunction', async (t) => {
  const key = new Uint8Array(32);
  const data = new Uint8Array([1, 2, 3]);
  const jws = await new GeneralSign(data)
    .addSignature(key, {
      signFunction: async (alg, sfKey, sfData) => {
        t.is(alg, 'HS256');
        t.is(sfKey, key);
        t.deepEqual(sfData, new TextEncoder().encode('eyJhbGciOiJIUzI1NiJ9.AQID'))
        return new Uint8Array([4, 5, 6]);
      },
    })
    .setProtectedHeader({ alg: 'HS256' })
    .sign()

  t.is(jws.payload, 'AQID')
  t.deepEqual(jws.signatures, [{ protected: 'eyJhbGciOiJIUzI1NiJ9', signature: 'BAUG' }])
})
