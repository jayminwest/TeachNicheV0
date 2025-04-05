# Constants Linting Rules

This document outlines the linting rules designed to enforce proper usage of constants in the Teach Niche application.

## ESLint Rules Configuration

To enforce consistent usage of constants, add the following rules to your `.eslintrc.js` file:

```javascript
module.exports = {
  // ... existing config
  rules: {
    // ... existing rules
    
    // Enforce usage of constants over literal values
    "no-magic-numbers": [
      "warn",
      { 
        ignore: [-1, 0, 1, 2, 100],
        ignoreArrayIndexes: true,
        enforceConst: true,
        detectObjects: false,
      }
    ],
    
    // Prefer PascalCase for enum-like objects
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "interface",
        format: ["PascalCase"],
      },
      {
        selector: "typeAlias",
        format: ["PascalCase"],
      },
      {
        selector: "enum",
        format: ["PascalCase"],
      },
      {
        selector: "variable",
        modifiers: ["const"],
        types: ["boolean", "string", "number"],
        format: ["UPPER_CASE"],
        filter: {
          regex: "^[A-Z][A-Z_0-9]+$",
          match: true,
        },
      },
    ],
    
    // Enforce importing from barrel files
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/constants/*/!(index)"],
            message: "Import from the barrel file instead (e.g., '@/constants/app' instead of '@/constants/app/payment')",
          },
        ],
      },
    ],
  },
};
```

## Custom ESLint Rule for Enforcing Constants

Consider creating a custom ESLint rule to detect common patterns that should use constants:

```javascript
// eslint-plugin-teach-niche/rules/enforce-constants.js
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce using constants for common values",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        // HTTP status codes
        if (
          node.parent.type === "Property" &&
          node.parent.key.name === "status" &&
          typeof node.value === "number" &&
          [200, 201, 400, 401, 403, 404, 500].includes(node.value)
        ) {
          context.report({
            node,
            message: `Use HttpStatusCode enum instead of literal value ${node.value}`,
            fix(fixer) {
              const statusCodeMap = {
                200: "HttpStatusCode.OK",
                201: "HttpStatusCode.CREATED",
                400: "HttpStatusCode.BAD_REQUEST",
                401: "HttpStatusCode.UNAUTHORIZED",
                403: "HttpStatusCode.FORBIDDEN",
                404: "HttpStatusCode.NOT_FOUND",
                500: "HttpStatusCode.INTERNAL_SERVER_ERROR",
              };
              return fixer.replaceText(node, statusCodeMap[node.value]);
            },
          });
        }
        
        // API endpoints
        if (
          typeof node.value === "string" &&
          node.value.startsWith("/api/")
        ) {
          context.report({
            node,
            message: `Use ApiEndpoints constant instead of hardcoded URL "${node.value}"`,
          });
        }
        
        // Stripe constants
        if (
          typeof node.value === "number" &&
          node.parent.parent.type === "VariableDeclarator" &&
          /fee|percentage/i.test(node.parent.parent.id.name)
        ) {
          context.report({
            node,
            message: `Use PLATFORM_FEE_PERCENTAGE or other constants instead of hardcoded values`,
          });
        }
      },
    };
  },
};
```

## Pre-commit Hooks

Set up a pre-commit hook to run these linting rules before every commit:

1. Install Husky and lint-staged:

```bash
npm install --save-dev husky lint-staged
```

2. Update `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "git add"
    ]
  }
}
```

## IDE Integration

### VSCode Snippets

Add custom snippets for creating constants in the appropriate format:

```json
{
  "Create constant": {
    "prefix": "const",
    "body": [
      "/**",
      " * $2",
      " */",
      "export const $1 = $3;"
    ],
    "description": "Create a properly documented constant"
  },
  
  "Create enum": {
    "prefix": "enum",
    "body": [
      "/**",
      " * $2",
      " */",
      "export enum $1 {",
      "  $3 = '$4',",
      "}"
    ],
    "description": "Create a properly documented enum"
  }
}
```

### VS Code Settings

Add recommended VS Code settings for working with constants:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["typescript", "typescriptreact"],
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

## Automated Audit

Create a script to automatically detect hardcoded values that should be constants:

```javascript
// scripts/detect-magic-values.js
const { execSync } = require('child_process');
const fs = require('fs');

// Patterns to detect
const patterns = [
  { regex: /status: [0-9]{3}/, description: "HTTP status code" },
  { regex: /['"]\/api\/[^'"]+['"]/, description: "API endpoint" },
  { regex: /['"]http[s]?:\/\/[^'"]+['"]/, description: "URL" },
  { regex: /fee[^:]*: [0-9]+/, description: "Fee amount" },
  { regex: /percentage[^:]*: [0-9]+/, description: "Percentage value" },
];

// Search through files
let output = "# Potential Magic Values Report\n\n";
patterns.forEach(({ regex, description }) => {
  output += `## ${description}\n\n`;
  try {
    const result = execSync(
      `grep -r "${regex.source}" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "constants/"`
    ).toString();
    
    if (result) {
      output += "```\n" + result + "\n```\n\n";
    } else {
      output += "No issues found.\n\n";
    }
  } catch (error) {
    output += "No issues found.\n\n";
  }
});

fs.writeFileSync('magic-values-report.md', output);
console.log("Magic values report generated: magic-values-report.md");
```

Add a script to `package.json`:

```json
{
  "scripts": {
    "audit:constants": "node scripts/detect-magic-values.js"
  }
}
```

## Continuous Integration

Add a step to your CI pipeline to check for constants usage:

```yaml
# .github/workflows/constants-check.yml
name: Constants Usage Check

on:
  pull_request:
    branches: [ main ]

jobs:
  check-constants:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run constants audit
        run: npm run audit:constants
      - name: Check ESLint rules
        run: npx eslint --rule 'no-magic-numbers: ["error"]' '**/*.ts' '**/*.tsx'
```

This comprehensive approach ensures consistency in constants usage throughout the codebase.
