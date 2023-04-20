import resolve from '@rollup/plugin-node-resolve'
import { babel } from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs';
import strip from '@rollup/plugin-strip';

const config = {
  input: './src/index.js',
  plugins: [
    resolve({
      moduleDirectories: ['node_modules']
    }),
    babel({ babelHelpers: 'bundled' }),
    // terser(),
    commonjs(),
    // strip()
  ],
  external: [],

  treeshake: true,
  output: {
    name: 'IDB',
    file: 'lib/bundle.js',
    format: "es",
    sourcemap: false
  }
}

export default config