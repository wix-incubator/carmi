// See https://babeljs.io/docs/en/config-files#project-wide-configuration
module.exports = api => {
    const env = api.env()

    const config = {
        // default presets and plugins for every package
        plugins: ['@babel/plugin-transform-modules-commonjs'],

        babelrcRoots: [
            // keep the root as a root
            __dirname,

            // also consider monorepo packages "root" and load their .babelrc files.
            '{,!(node_modules)*}'
        ],
        presets: ['@babel/preset-typescript']
    }

    // optimize to specific envs
    // transpule for all targets by default;
    return config
}
