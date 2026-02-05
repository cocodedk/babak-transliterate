const CONFIG = {
  LANGUAGES: [
    { code: 'fa', name: 'Persian (فارسی)', script: 'Arabic' }
  ],
  DEFAULT_LANGUAGE: 'fa',
  STORAGE_KEYS: {
    API_URL: 'apiUrl',
    API_KEY: 'apiKey',
    ENCRYPTION_KEY: 'encryptionKey',
    CHAT_HISTORY: 'chatHistory',
    LAST_RESULTS: 'lastResults'
  },
  PROMPTS: {
    TRANSLITERATE: (text, language) => 
      `Transliterate the following Latin/English text into ${language} script.\n` +
      `IMPORTANT: This is TRANSLITERATION, not translation. Convert the SOUNDS, not the meaning.\n` +
      `Example: "hello" becomes "هلو" (sounds like "hello"), NOT "سلام" (meaning of hello).\n` +
      `Only return the transliterated text, no explanations.\n\n` +
      `Text: ${text}`,
    TRANSLATE: (text, language) =>
      `Translate the following text into ${language}.\n` +
      `Provide the actual meaning in ${language}, not a phonetic conversion.\n` +
      `Only return the translated text, no explanations.\n\n` +
      `Text: ${text}`,
    ASCII_ART: (request) =>
      `Create ASCII art of: ${request}\n` +
      `Use only standard ASCII characters.\n` +
      `Ensure the art is creative and well-formatted.\n` +
      `Return ONLY the ASCII art, no additional text.`
  }
};

export default CONFIG;
