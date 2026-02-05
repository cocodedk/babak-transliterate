class ScriptCipher {
  encrypt(plaintext, masterKey) {
    const salt = Array.from({length: 16}, () => 
      String.fromCharCode(Math.floor(Math.random() * 256))
    ).join('');
    
    const combined = masterKey + salt;
    const keyBytes = [];
    for (let i = 0; i < 32; i++) {
      keyBytes.push(combined.charCodeAt(i % combined.length));
    }
    
    const textBytes = new TextEncoder().encode(plaintext);
    const encrypted = [];
    
    for (let i = 0; i < textBytes.length; i++) {
      const keyByte = keyBytes[i % keyBytes.length];
      encrypted.push(textBytes[i] ^ keyByte);
    }
    
    // Store salt + encrypted
    const result = new Uint8Array(16 + encrypted.length);
    for (let i = 0; i < 16; i++) {
      result[i] = salt.charCodeAt(i);
    }
    for (let i = 0; i < encrypted.length; i++) {
      result[16 + i] = encrypted[i];
    }
    
    return btoa(String.fromCharCode(...result));
  }

  decrypt(ciphertext, masterKey) {
    try {
      const bytes = new Uint8Array(
        atob(ciphertext).split('').map(c => c.charCodeAt(0))
      );
      
      const salt = String.fromCharCode(...bytes.slice(0, 16));
      const encrypted = bytes.slice(16);
      
      const combined = masterKey + salt;
      const keyBytes = [];
      for (let i = 0; i < 32; i++) {
        keyBytes.push(combined.charCodeAt(i % combined.length));
      }
      
      const decrypted = [];
      for (let i = 0; i < encrypted.length; i++) {
        const keyByte = keyBytes[i % keyBytes.length];
        decrypted.push(encrypted[i] ^ keyByte);
      }
      
      return new TextDecoder().decode(new Uint8Array(decrypted));
    } catch (e) {
      console.error('Decryption error:', e);
      return null;
    }
  }
}

export default ScriptCipher;
