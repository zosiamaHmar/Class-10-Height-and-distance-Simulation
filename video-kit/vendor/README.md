`mediabunny.min.js` is an unmodified, tree-shaken build of [Mediabunny](https://github.com/Vanilagy/mediabunny) 1.59.1 (MPL-2.0).
It was built with esbuild from `mediabunny-entry.mjs`:

    npx esbuild mediabunny-entry.mjs --bundle --minify --format=iife --global-name=MB --outfile=mediabunny.min.js --legal-comments=eof

The source code is available at https://github.com/Vanilagy/mediabunny under the Mozilla Public License 2.0.
