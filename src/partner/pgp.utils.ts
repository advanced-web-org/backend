import * as openpgp from 'openpgp';
import * as crypto from 'crypto';

export async function verifySignature(publicKey: string, data: string, signature: string): Promise<boolean> {
  const message = await openpgp.createMessage({ text: data });
  const verified = await openpgp.verify({
    message,
    signature: await openpgp.readSignature({ armoredSignature: signature }),
    verificationKeys: await openpgp.readKey({ armoredKey: publicKey }),
  });
  return verified.signatures[0].verified;
}

export async function signData(privateKey: string, passphrase: string, data: string): Promise<string> {
  const privateKeyObj = await openpgp.decryptKey({
    privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
    passphrase,
  });
  const message = await openpgp.createMessage({ text: data });
  return await openpgp.sign({
    message,
    signingKeys: privateKeyObj,
  });
}

export function hashData(data: string, secretKey: string): string {
  return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
}
