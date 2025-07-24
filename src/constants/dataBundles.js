export const BUNDLE_CATEGORIES = ['Daily', 'Weekly', 'Monthly', 'Nightly', 'Mixed'];

export const COUNTRIES = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'US', name: 'United States' },
    { code: 'IN', name: 'India' },
    { code: 'PK', name: 'Pakistan' },
    // add more
];

// Each country has a bundles array; each bundle has category & price
export const DATA_BUNDLES = {
    AF: [
        { id: 'af_d1', category: 'Daily', usd: 1, afn: 75, desc: '100MB 1 Day' },
        { id: 'af_d2', category: 'Daily', usd: 2, afn: 150, desc: '250MB 1 Day' },
        { id: 'af_w1', category: 'Weekly', usd: 5, afn: 375, desc: '1.5GB 7 Days' },
        { id: 'af_m1', category: 'Monthly', usd: 10, afn: 750, desc: '4GB 30 Days' },
        { id: 'af_n1', category: 'Nightly', usd: 3, afn: 225, desc: '2GB Night Pack' },
        { id: 'af_mix', category: 'Mixed', usd: 6, afn: 450, desc: '500MB + 1GB Night' },
    ],
    US: [
        { id: 'us_d1', category: 'Daily', usd: 1.5, afn: 112, desc: '150MB 1 Day' },
        { id: 'us_w1', category: 'Weekly', usd: 6, afn: 450, desc: '2GB 7 Days' },
    ],
    // ...
};
