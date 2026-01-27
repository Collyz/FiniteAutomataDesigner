// import typescript from '@rollup/plugin-typescript';
// import { nodeResolve } from '@rollup/plugin-node-resolve';

// export default {
//   input: {dfa: "public/scripts/dfaCanvas.ts", nfa: "public/scripts/nfaCanvas.ts"},
//   output: {
//     // file: {dfa: 'public/scripts/dfaCanvas.js', nfa: 'public/scripts/nfaCanvas.js'},
//     // format: 'iife',
//     // name: {dfa: 'DfaCanvas', nfa: 'NfaCanvas'},
//     dir: "public/scripts/",
//     format: "esm",
//     entryFileNames: "[name]Canvas.js",
//   },
//   plugins: [
//     nodeResolve(),
//     typescript({
//       tsconfig: './tsconfig.json',
//       sourceMap: false,
//       compilerOptions: {
//         module: 'esnext',
//         target: 'es2020'
//       },
//       outputToFilesystem: false, // Prevents dupilicate file writes
//     }),
    
//   ],
  
// };

import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'public/scripts/nfaCanvas.ts',
  output: {
    file: 'public/scripts/nfaCanvas.js',
    format: 'iife',
    name: 'NfaCanvas'
  },
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: false,
      compilerOptions: {
        module: 'esnext',
        target: 'es2020'
      },
      outputToFilesystem: false, // Prevents dupilicate file writes
    }),
    
  ],
  
};