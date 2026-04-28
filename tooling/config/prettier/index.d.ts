export interface PrettierOptions {
  semi: boolean;
  singleQuote: boolean;
  trailingComma: 'all' | 'es5' | 'none';
  printWidth: number;
  tabWidth: number;
  bracketSpacing: boolean;
  bracketSameLine: boolean;
  plugins: string[];
  xmlSelfClosingSpace: boolean;
  xmlWhitespaceSensitivity: 'strict' | 'preserve' | 'ignore';
}
declare const config: PrettierOptions;
export default config;
