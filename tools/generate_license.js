#!/usr/bin/env node
/**
 * CardCraft 思源映卡 (siyuan-cardcraft) - Ed25519 离线激活码签发与验签工具
 *
 * 私钥与卡密库存严格保存在 .private/ 目录（已被 .gitignore 忽略，严禁提交至 Git 或打入 package.zip）
 *
 * 激活码格式：
 *   - 终身专业版：SYCC-PRO-<8位序列号>-<86位Ed25519签名(Base64URL)>
 *   - 双插件联名包：SYCC-BUNDLE-<8位序列号>-<86位Ed25519签名(Base64URL)>
 * 签名原文：
 *   SYCC_V1|<EDITION>|<SERIAL>
 *
 * 用法示例：
 *   1. 初始化密钥对并查看公钥参数：
 *      node tools/generate_license.js --pubkey
 *   2. 批量生成 100 个 Pro 激活码：
 *      node tools/generate_license.js --edition PRO --count 100 --out .private/stock_pro_100.txt
 *   3. 批量生成 50 个 Bundle 联名版激活码：
 *      node tools/generate_license.js --edition BUNDLE --count 50 --out .private/stock_bundle_50.txt
 *   4. 校验任意激活码：
 *      node tools/generate_license.js --verify SYCC-PRO-XXXXXXXX-...
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PRIVATE_DIR = path.join(ROOT_DIR, '.private');
const PRIV_KEY_PATH = path.join(PRIVATE_DIR, 'ed25519_private.pem');
const PUB_KEY_PATH = path.join(PRIVATE_DIR, 'ed25519_public.pem');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function ensureKeyPair() {
    if (!fs.existsSync(PRIVATE_DIR)) {
        fs.mkdirSync(PRIVATE_DIR, { recursive: true, mode: 0o700 });
    }
    if (!fs.existsSync(PRIV_KEY_PATH) || !fs.existsSync(PUB_KEY_PATH)) {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        fs.writeFileSync(PRIV_KEY_PATH, privateKey, { mode: 0o600 });
        fs.writeFileSync(PUB_KEY_PATH, publicKey, { mode: 0o644 });
        console.error(`🔐 已生成全新 Ed25519 密钥对并写入 ${PRIVATE_DIR}`);
    } else {
        try {
            fs.chmodSync(PRIV_KEY_PATH, 0o600);
        } catch (_) {
            // ignore chmod issues on non-POSIX filesystems
        }
    }
    return {
        privateKeyPem: fs.readFileSync(PRIV_KEY_PATH, 'utf8'),
        publicKeyPem: fs.readFileSync(PUB_KEY_PATH, 'utf8'),
    };
}

function generateSerial(len = 8, usedSet = null) {
    for (let attempt = 0; attempt < 1000; attempt++) {
        const bytes = crypto.randomBytes(len);
        let s = '';
        for (let i = 0; i < len; i++) {
            s += ALPHABET[bytes[i] % ALPHABET.length];
        }
        if (!usedSet || !usedSet.has(s)) {
            if (usedSet) usedSet.add(s);
            return s;
        }
    }
    throw new Error('Failed to generate unique serial');
}

function signLicense(privateKeyPem, edition = 'PRO', customSerial = '') {
    const cleanEdition = String(edition).trim().toUpperCase();
    if (cleanEdition !== 'PRO' && cleanEdition !== 'BUNDLE') {
        throw new Error(`Unsupported edition "${edition}". Must be PRO or BUNDLE.`);
    }
    const serial = (customSerial || generateSerial(8)).toUpperCase();
    const payload = `SYCC_V1|${cleanEdition}|${serial}`;
    const sig = crypto.sign(null, Buffer.from(payload, 'utf8'), privateKeyPem);
    return `SYCC-${cleanEdition}-${serial}-${sig.toString('base64url')}`;
}

function verifyLicense(publicKeyPem, licenseKey) {
    const clean = String(licenseKey || '').trim();
    const match = clean.match(/^SYCC-(PRO|BUNDLE)-([A-Z0-9]{6,16})-([A-Za-z0-9_-]{80,92})$/);
    if (!match) {
        return { valid: false, reason: 'FORMAT_INVALID' };
    }
    const edition = match[1];
    const serial = match[2];
    const sigB64Url = match[3];
    try {
        const sigBuf = Buffer.from(sigB64Url, 'base64url');
        if (sigBuf.length !== 64) {
            return { valid: false, reason: 'SIG_LEN_INVALID' };
        }
        const payload = Buffer.from(`SYCC_V1|${edition}|${serial}`, 'utf8');
        const ok = crypto.verify(null, payload, publicKeyPem, sigBuf);
        return ok
            ? { valid: true, edition, serial }
            : { valid: false, reason: 'SIGNATURE_MISMATCH' };
    } catch (err) {
        return { valid: false, reason: err.message };
    }
}

function getPublicKeyFormats(publicKeyPem) {
    const pubObj = crypto.createPublicKey(publicKeyPem);
    const spkiDer = pubObj.export({ type: 'spki', format: 'der' });
    // Ed25519 SPKI DER is 44 bytes: 12-byte OID header (302a300506032b6570032100) + 32-byte raw public key
    const raw32 = spkiDer.subarray(spkiDer.length - 32);
    return {
        pem: publicKeyPem.trim(),
        spkiBase64: spkiDer.toString('base64'),
        rawHex: raw32.toString('hex'),
    };
}

function main() {
    const args = process.argv.slice(2);
    const { privateKeyPem, publicKeyPem } = ensureKeyPair();

    if (args.includes('--pubkey')) {
        const info = getPublicKeyFormats(publicKeyPem);
        console.log(JSON.stringify(info, null, 2));
        return;
    }

    const verifyIdx = args.indexOf('--verify');
    if (verifyIdx !== -1 && args[verifyIdx + 1]) {
        const res = verifyLicense(publicKeyPem, args[verifyIdx + 1]);
        console.log(JSON.stringify(res));
        process.exit(res.valid ? 0 : 1);
    }

    let edition = 'PRO';
    const edIdx = args.indexOf('--edition');
    if (edIdx !== -1 && args[edIdx + 1]) {
        edition = args[edIdx + 1].toUpperCase();
    }

    let count = 1;
    const countIdx = args.indexOf('--count');
    if (countIdx !== -1 && args[countIdx + 1]) {
        count = Math.max(1, parseInt(args[countIdx + 1], 10) || 1);
    }

    let outFile = '';
    const outIdx = args.indexOf('--out');
    if (outIdx !== -1 && args[outIdx + 1]) {
        outFile = path.resolve(ROOT_DIR, args[outIdx + 1]);
    }

    const usedSerials = new Set();
    const keys = [];
    for (let i = 0; i < count; i++) {
        const serial = generateSerial(8, usedSerials);
        const key = signLicense(privateKeyPem, edition, serial);
        // Self-test every generated key before writing
        const check = verifyLicense(publicKeyPem, key);
        if (!check.valid) {
            throw new Error(`Self-verification failed for generated key: ${key}`);
        }
        keys.push(key);
    }

    if (outFile) {
        const outDir = path.dirname(outFile);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true, mode: 0o700 });
        }
        fs.writeFileSync(outFile, keys.join('\n') + '\n', { mode: 0o600 });
        console.log(`✅ 已成功签发并自检 ${keys.length} 枚 [${edition}] 激活码 -> ${outFile}`);
    } else {
        console.log(keys.join('\n'));
    }
}

if (require.main === module) {
    main();
}

module.exports = { ensureKeyPair, signLicense, verifyLicense, getPublicKeyFormats };
