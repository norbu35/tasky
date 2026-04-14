import baseConfig from '@tasky/tooling-config/eslint/base';

export default [...baseConfig, { ignores: ['dist/', 'src/generated/'] }];
