export function sanitizeOrigin(origin) {
  if (!origin) return origin;
  return origin.replace(/^['"`]+|['"`]+$/g, '').trim();
}

export function generateTokenSaldo() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export function calculateServicePrice(service, original) {
  if (service === 'cambio-notas') {
    const final = 350;
    return { original: final, discount: 0, final };
  }
  const discount = Number((original * 0.3).toFixed(2));
  const final = Number((original - discount).toFixed(2));
  return { original, discount, final };
}

export function toCurrency(n) {
  return Number(Number(n).toFixed(2));
}