import * as openpgp from 'openpgp';

export class PgpService {
  private publicKey: string;
  private privateKey: string;
  private passphrase: string;

  constructor() {
    this.publicKey = process.env.PGP_PUBLIC_KEY || ''; // Set public key in environment
    this.privateKey = process.env.PGP_PRIVATE_KEY || ''; // Set private key in environment
    this.passphrase = process.env.PGP_PASSPHRASE || ''; // Passphrase

    if (!this.publicKey || !this.privateKey || !this.passphrase) {
      throw new Error('PGP keys and passphrase must be set in environment variables');
    }
  }

  async encrypt(data: string): Promise<string> {
    const publicKey = await openpgp.readKey({ armoredKey: this.publicKey });
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: data }),
      encryptionKeys: publicKey,
    });
    return encrypted;
  }

  async decrypt(encryptedData: string): Promise<string> {
    const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: this.privateKey }),
      passphrase: this.passphrase,
    });

    const message = await openpgp.readMessage({ armoredMessage: encryptedData });
    const { data } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey,
    });

    return data;
  }
}
