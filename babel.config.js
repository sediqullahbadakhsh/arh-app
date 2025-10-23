module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            'react-native-worklets/plugin',
            '@babel/plugin-transform-runtime',
            // ['module-resolver', {
            //     root: ['./'],
            //     extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
            //     alias: {
            //         // Only keep essential aliases, remove problematic ones
            //         '@': './src',
            //         '~': './',
            //     }
            // }]
            // ['module-resolver', {
            //     root: ['./'],
            //     alias: {
            //         'crypto': 'react-native-quick-crypto', // Use this instead of react-native-crypto
            //         'stream': 'readable-stream',
            //         'buffer': 'buffer',
            //         'events': 'events',
            //         'ws': './empty-module.js',
            //         'engine.io-client': 'engine.io-client'
            //     }
            // }]
        ]
    };
};