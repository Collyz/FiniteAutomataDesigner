import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'public/scripts/draw/drawCanvas.ts',
  output: {
    file: 'public/scripts/draw/drawCanvas.js',
    format: 'iife',
    name: 'DrawCanvas'
  },
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.canvas.json', // see the comment at the top of that file
      sourceMap: false,
      compilerOptions: {
        module: 'esnext',
        target: 'es2020'
      },
      outputToFilesystem: false, // Prevents dupilicate file writes
    }),
    
  ],
  
};