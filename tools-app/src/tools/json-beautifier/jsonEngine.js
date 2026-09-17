/**
 * Enterprise In-Browser JSON Engine
 * 100% Client-Side - Zero external library bloat - Fast & GDPR Safe
 */

// Recursive Object Key Sorter
export function sortObjectKeys(data) {
  if (Array.isArray(data)) {
    return data.map(sortObjectKeys);
  }
  if (data !== null && typeof data === 'object') {
    const sorted = {};
    Object.keys(data)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        sorted[key] = sortObjectKeys(data[key]);
      });
    return sorted;
  }
  return data;
}

// Format / Beautify JSON
export function formatJson(input, indent = 2, sortKeys = false) {
  const parsed = typeof input === 'string' ? JSON.parse(input) : input;
  const target = sortKeys ? sortObjectKeys(parsed) : parsed;
  const indentSpace = indent === 'tab' ? '\t' : Number(indent);
  return JSON.stringify(target, null, indentSpace);
}

// Minify / Compact JSON
export function minifyJson(input) {
  const parsed = typeof input === 'string' ? JSON.parse(input) : input;
  return JSON.stringify(parsed);
}

// Intelligent Auto-Repair for Broken / Malformed JSON
export function repairJson(raw) {
  if (!raw || !raw.trim()) return '';

  let cleaned = raw.trim();

  // 1. Strip standard JS comments (// ... and /* ... */)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  cleaned = cleaned.replace(/(^|[^:])\/\/[^\n\r]*/g, '$1');

  // 2. Normalize Python literals: None -> null, True -> true, False -> false
  cleaned = cleaned.replace(/\bNone\b/g, 'null');
  cleaned = cleaned.replace(/\bTrue\b/g, 'true');
  cleaned = cleaned.replace(/\bFalse\b/g, 'false');

  // 3. Normalize single quotes to double quotes for strings and keys
  // Avoid replacing apostrophes inside words if possible, but standard JSON uses double quotes
  cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');

  // 4. Quote unquoted object keys: { foo: 123 } -> { "foo": 123 }
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_$-]+)(\s*:)/g, '$1"$2"$3');

  // 5. Remove trailing commas before closing braces/brackets: { "a": 1, } -> { "a": 1 }
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // 6. Fix missing closing brackets or braces at EOF if simple
  const openBraces = (cleaned.match(/{/g) || []).length;
  const closeBraces = (cleaned.match(/}/g) || []).length;
  if (openBraces > closeBraces) {
    cleaned += '}'.repeat(openBraces - closeBraces);
  }

  const openBrackets = (cleaned.match(/\[/g) || []).length;
  const closeBrackets = (cleaned.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    cleaned += ']'.repeat(openBrackets - closeBrackets);
  }

  // Verify and parse
  const parsed = JSON.parse(cleaned);
  return JSON.stringify(parsed, null, 2);
}

// Analyze JSON Statistics
export function analyzeJsonStats(rawText, parsedObj = null) {
  try {
    const data = parsedObj !== null ? parsedObj : JSON.parse(rawText);
    const rawBytes = new Blob([rawText]).size;
    const minified = JSON.stringify(data);
    const minifiedBytes = new Blob([minified]).size;
    const formatted = JSON.stringify(data, null, 2);
    const formattedBytes = new Blob([formatted]).size;

    let nodeCount = 0;
    let maxDepth = 0;
    const types = { object: 0, array: 0, string: 0, number: 0, boolean: 0, null: 0 };

    const traverse = (node, depth = 1) => {
      nodeCount++;
      if (depth > maxDepth) maxDepth = depth;

      if (node === null) {
        types.null++;
      } else if (Array.isArray(node)) {
        types.array++;
        node.forEach((item) => traverse(item, depth + 1));
      } else if (typeof node === 'object') {
        types.object++;
        Object.values(node).forEach((val) => traverse(val, depth + 1));
      } else if (typeof node === 'string') {
        types.string++;
      } else if (typeof node === 'number') {
        types.number++;
      } else if (typeof node === 'boolean') {
        types.boolean++;
      }
    };

    traverse(data);

    const savingsPercent = rawBytes > 0 
      ? Math.max(0, Math.round(((rawBytes - minifiedBytes) / rawBytes) * 100))
      : 0;

    return {
      isValid: true,
      rawBytes,
      minifiedBytes,
      formattedBytes,
      savingsPercent,
      nodeCount,
      maxDepth,
      types,
      lines: rawText.split('\n').length
    };
  } catch (err) {
    return {
      isValid: false,
      error: err.message,
      rawBytes: new Blob([rawText]).size,
      lines: rawText.split('\n').length
    };
  }
}

// Convert JSON to TypeScript Interfaces
export function jsonToTypeScript(parsed, rootName = 'RootObject') {
  const interfaces = [];
  const generatedNames = new Set();

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const generate = (obj, name) => {
    let typeName = capitalize(name);
    if (generatedNames.has(typeName)) {
      typeName += '_' + Math.floor(Math.random() * 1000);
    }
    generatedNames.add(typeName);

    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'any[]';
      const itemType = generate(obj[0], name + 'Item');
      return `${itemType}[]`;
    }

    if (obj !== null && typeof obj === 'object') {
      const lines = [`export interface ${typeName} {`];
      for (const [key, value] of Object.entries(obj)) {
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
        let valType = 'any';

        if (value === null) {
          valType = 'null | any';
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            valType = 'any[]';
          } else if (typeof value[0] === 'object' && value[0] !== null) {
            const nestedName = generate(value[0], key);
            valType = `${nestedName}[]`;
          } else {
            valType = `${typeof value[0]}[]`;
          }
        } else if (typeof value === 'object') {
          valType = generate(value, key);
        } else {
          valType = typeof value;
        }

        lines.push(`  ${safeKey}: ${valType};`);
      }
      lines.push('}');
      interfaces.push(lines.join('\n'));
      return typeName;
    }

    return typeof obj;
  };

  generate(parsed, rootName);
  return interfaces.reverse().join('\n\n');
}

// Convert JSON to YAML (Zero-Dependency)
export function jsonToYaml(obj, indent = 0) {
  const spaces = '  '.repeat(indent);

  if (obj === null) return 'null';
  if (typeof obj === 'boolean' || typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') || obj.startsWith('@')) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const nested = jsonToYaml(item, indent + 1).trimStart();
          return `${spaces}- ${nested}`;
        }
        return `${spaces}- ${jsonToYaml(item, indent + 1)}`;
      })
      .join('\n');
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    return keys
      .map((key) => {
        const val = obj[key];
        if (typeof val === 'object' && val !== null) {
          return `${spaces}${key}:\n${jsonToYaml(val, indent + 1)}`;
        }
        return `${spaces}${key}: ${jsonToYaml(val, indent + 1)}`;
      })
      .join('\n');
  }

  return String(obj);
}

// Convert JSON Array of Objects to CSV
export function jsonToCsv(data) {
  let list = Array.isArray(data) ? data : [data];
  if (list.length === 0) return '';

  // Filter objects
  list = list.filter((item) => item !== null && typeof item === 'object');
  if (list.length === 0) return '';

  // Extract all unique column headers
  const headers = Array.from(new Set(list.flatMap((item) => Object.keys(item))));

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [headers.join(',')];
  list.forEach((item) => {
    const row = headers.map((h) => escapeCsv(item[h]));
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

// Curated JSON Sample Templates
export const JSON_SAMPLE_TEMPLATES = {
  ecommerce: {
    name: 'E-Commerce Order',
    json: JSON.stringify({
      orderId: 'ORD-98421',
      createdAt: '2026-09-17T18:45:00Z',
      status: 'confirmed',
      customer: {
        id: 'usr_7831',
        name: 'Alex Rivera',
        email: 'alex.rivera@example.com',
        loyaltyTier: 'Gold'
      },
      items: [
        { sku: 'M3-MBP-16', name: 'MacBook Pro 16"', quantity: 1, unitPrice: 2499.00 },
        { sku: 'APL-MC-USB', name: 'USB-C Cable 2m', quantity: 2, unitPrice: 29.00 }
      ],
      payment: {
        method: 'credit_card',
        cardBrand: 'Visa',
        last4: '4242',
        totalAmount: 2557.00,
        currency: 'USD',
        isCaptured: true
      },
      shippingAddress: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'US'
      }
    }, null, 2)
  },
  apiResponse: {
    name: 'API Cloud Cluster',
    json: JSON.stringify({
      apiVersion: 'v2.4.0',
      region: 'us-east-1',
      cluster: {
        id: 'cls_k8s_prod_01',
        nodeCount: 12,
        healthy: true,
        metrics: {
          cpuUtilization: 0.42,
          memoryUsageGb: 64.8,
          networkInMbits: 1240.5
        },
        tags: ['production', 'enterprise', 'pci-dss']
      },
      activeDeployments: [
        { service: 'auth-service', replicas: 3, status: 'RUNNING' },
        { service: 'payment-gateway', replicas: 4, status: 'RUNNING' },
        { service: 'reporting-worker', replicas: 2, status: 'IDLE' }
      ]
    }, null, 2)
  },
  malformed: {
    name: 'Broken JSON (For Auto-Repair Test)',
    json: `{
  // Invalid comments in JSON
  unquoted_key: 'Single quoted string value',
  trailing_comma_array: [
    1, 2, 3,
  ],
  python_literals: {
    isAdmin: True,
    deletedAt: None,
    verified: False,
  }
}`
  }
};
