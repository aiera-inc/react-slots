import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commonConfig = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.tsx$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
};

function reactEnv(version) {
  const envDir = path.resolve(__dirname, `test-envs/react-${version}/node_modules`);
  return {
    ...commonConfig,
    displayName: `react-${version}`,
    moduleNameMapper: {
      '^react$': path.join(envDir, 'react'),
      '^react-dom$': path.join(envDir, 'react-dom'),
      '^react-dom/(.*)$': path.join(envDir, 'react-dom/$1'),
      '^react/(.*)$': path.join(envDir, 'react/$1'),
    },
  };
}

export default {
  projects: [reactEnv('18'), reactEnv('19')],
};
