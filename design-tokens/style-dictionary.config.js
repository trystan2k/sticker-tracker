const themeExtensionKey = 'sticker-tracker';
const tokenReferencePattern = /\{([^}]+)\}/g;

const isQuoted = (value) => /^['"].*['"]$/.test(value);

const formatCssValue = (token, value) => {
  if (typeof value !== 'string') {
    return String(value);
  }

  if (token.$type === 'fontFamily' && (isQuoted(value) || !/\s/.test(value))) {
    return value;
  }

  if (token.$type === 'fontFamily' && /\s/.test(value)) {
    return `'${value.replaceAll("'", "\\'")}'`;
  }

  return value;
};

const getDescription = (token) => token.$description ?? token.original?.$description;
const tokenFromLayer = (layer) => (token) => token.filePath.includes(`design-tokens/${layer}/`);

const getReferenceToken = (path, dictionary) => {
  const referenceKey = `{${path}}`;
  const allTokens = dictionary.unfilteredAllTokens ?? dictionary.allTokens;

  return allTokens.find((token) => token.key === referenceKey);
};

const toCssReference = (value, dictionary) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replaceAll(tokenReferencePattern, (match, path) => {
    const reference = getReferenceToken(path, dictionary);

    return reference ? `var(--${reference.name})` : match;
  });
};

const resolveTokenValue = (token, dictionary, mode) => {
  const value =
    mode === 'dark'
      ? token.original?.$extensions?.[themeExtensionKey]?.modes?.dark
      : (token.original?.$value ?? token.$value);

  if (value == null) {
    return null;
  }

  return formatCssValue(token, toCssReference(value, dictionary));
};

const renderVariables = (tokens, dictionary, mode) =>
  tokens
    .map((token) => {
      const value = resolveTokenValue(token, dictionary, mode);

      if (value == null) {
        return null;
      }

      const description = getDescription(token);

      return `  --${token.name}: ${value};${description ? ` /** ${description} */` : ''}`;
    })
    .filter(Boolean)
    .join('\n');

const withIndent = (block, spaces) => block.replaceAll(/^/gm, ' '.repeat(spaces));

export default {
  $schema: 'https://unpkg.com/style-dictionary/schema/style-dictionary.config.schema.json',
  source: [
    'design-tokens/primitives/**/*.tokens.json',
    'design-tokens/semantic/**/*.tokens.json',
    'design-tokens/components/**/*.tokens.json'
  ],
  hooks: {
    formats: {
      'css/theme-variables': ({ dictionary }) => {
        const lightVariables = renderVariables(dictionary.allTokens, dictionary, 'light');
        const darkVariables = renderVariables(dictionary.allTokens, dictionary, 'dark');

        const sections = [
          '/**',
          ' * Do not edit directly, this file was auto-generated.',
          ' */',
          '',
          ':root,',
          '[data-theme="light"] {',
          lightVariables,
          '}'
        ];

        if (darkVariables) {
          sections.push(
            '',
            '[data-theme="dark"] {',
            darkVariables,
            '}',
            '',
            '@media (prefers-color-scheme: dark) {',
            '  :root:not([data-theme]) {',
            withIndent(darkVariables, 2),
            '  }',
            '}'
          );
        }

        return sections.join('\n');
      }
    }
  },
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'design-tokens/dist/',
      files: [
        {
          destination: 'primitives.css',
          format: 'css/theme-variables',
          filter: tokenFromLayer('primitives')
        },
        {
          destination: 'semantic.css',
          format: 'css/theme-variables',
          filter: tokenFromLayer('semantic')
        },
        {
          destination: 'components.css',
          format: 'css/theme-variables',
          filter: tokenFromLayer('components')
        }
      ]
    }
  }
};
