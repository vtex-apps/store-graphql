export function isBase64(str: string | undefined) {
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return str ? base64Regex.test(str) : false;
  }
