// RFC 8785 serialization, with a strict JSON reader at the file boundary.
export function canonical(value) {
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw Error('Non-finite number');
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    if (!value.isWellFormed()) throw Error('Unpaired Unicode surrogate');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) throw Error('Not a JSON value');
  return '{' + Object.keys(value).sort().map(k => canonical(k) + ':' + canonical(value[k])).join(',') + '}';
}

export function parseStrict(text) {
  let i = 0;
  const ws = () => { while (/[\x20\t\r\n]/.test(text[i] ?? 'X')) i++; };
  function string() {
    const start = i++;
    while (i < text.length) {
      const c = text[i++];
      if (c === '\\') i++;
      else if (c === '"') { const s = JSON.parse(text.slice(start, i)); if (!s.isWellFormed()) throw Error('Unpaired surrogate'); return s; }
    }
    throw Error('Unterminated string');
  }
  function value(depth = 0) {
    if (depth > 64) throw Error('JSON nesting limit'); ws();
    if (text[i] === '"') return string();
    if (text[i] === '{') {
      i++; ws(); const o = {}, seen = new Set();
      if (text[i] === '}') { i++; return o; }
      for (;;) {
        ws(); if (text[i] !== '"') throw Error('Object key required');
        const k = string(); if (seen.has(k)) throw Error('Duplicate key: ' + k); seen.add(k);
        ws(); if (text[i++] !== ':') throw Error('Colon required');
        Object.defineProperty(o, k, {value:value(depth+1), enumerable:true, writable:true, configurable:true}); ws();
        const c = text[i++]; if (c === '}') return o; if (c !== ',') throw Error('Comma required');
      }
    }
    if (text[i] === '[') {
      i++; ws(); const a = []; if (text[i] === ']') { i++; return a; }
      for (;;) { a.push(value(depth+1)); ws(); const c=text[i++]; if(c===']') return a; if(c!==',') throw Error('Comma required'); }
    }
    const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(i));
    if (!match) throw Error('Invalid JSON token'); i += match[0].length;
    const v = JSON.parse(match[0]); if (typeof v === 'number' && !Number.isFinite(v)) throw Error('Non-finite number'); return v;
  }
  const result=value(); ws(); if(i!==text.length) throw Error('Trailing JSON content'); return result;
}

