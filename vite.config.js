import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'
import path from 'path'


export default defineConfig({
  // plugins: [vue()],
  resolve: {
    alias: {
      // 'npm': path.resolve(__dirname, './node_modules/@types/'),
      // '@': path.resolve(__dirname, './src'),
    },
  }
})
// import vue from '@vitejs/plugin-vue'
// import { resolve } from 'path'
// const path = require('path')
//
// export default defineConfig({
//   plugins: [vue()],
//   resolve: {
//     alias: {
//       '@': resolve(__dirname, './src')
//     }
//   },
//   build: {
//     lib: {
//       entry: path.resolve(__dirname, 'lib/main.js'),
//       name: 'MyLib',
//       fileName: (format) => `my-lib.${format}.js`
//     },
//     rollupOptions: {
//       // make sure to externalize deps that shouldn't be bundled
//       // into your library
//       external: ['vue'],
//       output: {
//         // Provide global variables to use in the UMD build
//         // for externalized deps
//         globals: {
//           vue: 'Vue'
//         }
//       }
//     }
//   }
//
// })

// export default defineConfig({
//   optimizeDeps: {
//     include: ['src']
//   },
//   build: {
//     commonjsOptions: {
//       include: [/src/]
//     }
//   }
// })