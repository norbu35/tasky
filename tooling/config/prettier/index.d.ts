export interface PrettierOptions {
  semi: boolean;
  singleQuote: boolean;
  trailingComma: 'all' | 'es5' | 'none';
  printWidth: number;
  tabWidth: number;
  bracketSpacing: boolean;
}
declare const config: PrettierOptions;
export default config;
