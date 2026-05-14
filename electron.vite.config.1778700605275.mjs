// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
var __electron_vite_injected_dirname = "C:\\Users\\Administrateur\\Downloads\\craft-launcher-main\\craft-launcher-main";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist-electron",
      rollupOptions: {
        input: {
          main: resolve(__electron_vite_injected_dirname, "electron/main.ts")
        },
        output: {
          format: "es",
          entryFileNames: "[name].js"
        }
      },
      // Optimisations pour le main process
      minify: "esbuild",
      target: "node24",
      sourcemap: true
    },
    resolve: {
      alias: {
        "@electron": resolve(__electron_vite_injected_dirname, "electron")
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist-electron",
      emptyOutDir: false,
      rollupOptions: {
        input: {
          preload: resolve(__electron_vite_injected_dirname, "electron/preload.ts")
        },
        output: {
          format: "cjs",
          entryFileNames: "[name].cjs"
        }
      },
      minify: "esbuild",
      target: "node24",
      sourcemap: true
    }
  },
  renderer: {
    root: ".",
    build: {
      outDir: "dist",
      // Optimisations pour le renderer
      minify: "esbuild",
      target: "chrome146",
      sourcemap: true,
      chunkSizeWarningLimit: 1e3,
      // Code splitting optimisé
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "index.html")
        },
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"]
          }
        }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__electron_vite_injected_dirname, "src"),
        "@assets": resolve(__electron_vite_injected_dirname, "src/assets")
      }
    },
    // Optimisations de performance
    optimizeDeps: {
      include: ["react", "react-dom", "@heroicons/react"],
      esbuildOptions: {
        target: "chrome146"
      }
    },
    server: {
      port: 5173,
      strictPort: true
    }
  }
});
export {
  electron_vite_config_default as default
};
