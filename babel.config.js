module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            'react-native-worklets/plugin',
            '@babel/plugin-transform-runtime',
            ['module-resolver', {
                alias: {
                    'crypto': 'react-native-crypto',
                    'stream': 'stream-browserify',
                    'buffer': 'buffer',
                    'events': 'events',
                    'ws': './empty-module.js',
                    'engine.io-client': 'engine.io-client/build/esm/index.js'
                }
            }]
        ]
    };
};