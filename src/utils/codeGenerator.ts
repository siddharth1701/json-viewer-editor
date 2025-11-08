import type { JSONValue, CodeLanguage } from '@/types';

function inferType(value: JSONValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'any[]';
    return inferType(value[0]) + '[]';
  }
  if (typeof value === 'object') return 'object';
  return typeof value;
}

export function generateTypeScript(data: JSONValue, interfaceName: string = 'Root'): string {
  function buildInterface(obj: any, name: string): string {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return '';
    }

    let code = `export interface ${name} {\n`;

    Object.entries(obj).forEach(([key, value]) => {
      const tsType = getTSType(value as JSONValue, key);
      code += `  ${key}: ${tsType};\n`;
    });

    code += '}\n\n';

    // Generate nested interfaces
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
        code += buildInterface(value, nestedName);
      }
    });

    return code;
  }

  function getTSType(value: JSONValue, key: string): string {
    if (value === null) return 'null';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'any[]';
      const itemType = getTSType(value[0], key);
      return `${itemType}[]`;
    }
    if (typeof value === 'object') {
      const typeName = key.charAt(0).toUpperCase() + key.slice(1);
      return typeName;
    }
    return 'any';
  }

  return buildInterface(data, interfaceName);
}

export function generateJavaScript(data: JSONValue, className: string = 'DataModel'): string {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return '// Cannot generate class from non-object data';
  }

  let code = `class ${className} {\n`;
  code += `  constructor(data = {}) {\n`;

  Object.keys(data).forEach((key) => {
    code += `    this.${key} = data.${key};\n`;
  });

  code += `  }\n\n`;

  code += `  toJSON() {\n`;
  code += `    return {\n`;
  Object.keys(data).forEach((key) => {
    code += `      ${key}: this.${key},\n`;
  });
  code += `    };\n`;
  code += `  }\n`;

  code += `}\n\n`;
  code += `export default ${className};`;

  return code;
}

export function generatePython(data: JSONValue, className: string = 'DataModel'): string {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return '# Cannot generate dataclass from non-object data';
  }

  let code = `from dataclasses import dataclass\nfrom typing import Optional, List, Dict, Any\n\n`;
  code += `@dataclass\nclass ${className}:\n`;

  Object.entries(data).forEach(([key, value]) => {
    const pythonType = getPythonType(value);
    code += `    ${key}: ${pythonType}\n`;
  });

  return code;
}

function getPythonType(value: JSONValue): string {
  if (value === null) return 'Optional[Any]';
  if (typeof value === 'string') return 'str';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int' : 'float';
  }
  if (typeof value === 'boolean') return 'bool';
  if (Array.isArray(value)) return 'List[Any]';
  if (typeof value === 'object') return 'Dict[str, Any]';
  return 'Any';
}

export function generateJava(data: JSONValue, className: string = 'DataModel'): string {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return '// Cannot generate class from non-object data';
  }

  let code = `public class ${className} {\n`;

  // Fields
  Object.entries(data).forEach(([key, value]) => {
    const javaType = getJavaType(value);
    code += `    private ${javaType} ${key};\n`;
  });

  code += '\n';

  // Constructor
  code += `    public ${className}() {}\n\n`;

  // Getters and Setters
  Object.entries(data).forEach(([key, value]) => {
    const javaType = getJavaType(value);
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);

    code += `    public ${javaType} get${capitalizedKey}() {\n`;
    code += `        return ${key};\n`;
    code += `    }\n\n`;

    code += `    public void set${capitalizedKey}(${javaType} ${key}) {\n`;
    code += `        this.${key} = ${key};\n`;
    code += `    }\n\n`;
  });

  code += `}`;

  return code;
}

function getJavaType(value: JSONValue): string {
  if (value === null) return 'Object';
  if (typeof value === 'string') return 'String';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int' : 'double';
  }
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'List<Object>';
  if (typeof value === 'object') return 'Map<String, Object>';
  return 'Object';
}

export function generateCSharp(data: JSONValue, className: string = 'DataModel'): string {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return '// Cannot generate class from non-object data';
  }

  let code = `public class ${className}\n{\n`;

  Object.entries(data).forEach(([key, value]) => {
    const csType = getCSharpType(value);
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
    code += `    public ${csType} ${capitalizedKey} { get; set; }\n`;
  });

  code += `}`;

  return code;
}

function getCSharpType(value: JSONValue): string {
  if (value === null) return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int' : 'double';
  }
  if (typeof value === 'boolean') return 'bool';
  if (Array.isArray(value)) return 'List<object>';
  if (typeof value === 'object') return 'Dictionary<string, object>';
  return 'object';
}

export function generateGo(data: JSONValue, structName: string = 'DataModel'): string {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return '// Cannot generate struct from non-object data';
  }

  let code = `type ${structName} struct {\n`;

  Object.entries(data).forEach(([key, value]) => {
    const goType = getGoType(value);
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
    code += `    ${capitalizedKey} ${goType} \`json:"${key}"\`\n`;
  });

  code += `}`;

  return code;
}

function getGoType(value: JSONValue): string {
  if (value === null) return 'interface{}';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int' : 'float64';
  }
  if (typeof value === 'boolean') return 'bool';
  if (Array.isArray(value)) return '[]interface{}';
  if (typeof value === 'object') return 'map[string]interface{}';
  return 'interface{}';
}

export function generateCode(
  data: JSONValue,
  language: CodeLanguage,
  name: string = 'DataModel'
): string {
  switch (language) {
    case 'typescript':
      return generateTypeScript(data, name);
    case 'javascript':
      return generateJavaScript(data, name);
    case 'python':
      return generatePython(data, name);
    case 'java':
      return generateJava(data, name);
    case 'csharp':
      return generateCSharp(data, name);
    case 'go':
      return generateGo(data, name);
    default:
      return '// Unsupported language';
  }
}
