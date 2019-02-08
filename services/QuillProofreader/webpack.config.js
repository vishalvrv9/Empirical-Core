const { resolve } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const OpenBrowserPlugin = require('open-browser-webpack-plugin');
const tsImportPluginFactory = require('ts-import-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    mode: 'development',
    context: resolve(__dirname, 'src'),
    entry: [
        'webpack-dev-server/client?http://localhost:8070',
        // bundle the client for webpack-dev-server
        // and connect to the provided endpoint
        'webpack/hot/only-dev-server',
        // bundle the client for hot reloading
        // only- means to only hot reload for successful updates
        './index.tsx',
        // the entry point of our app
        './styles/style.scss'
    ],
    output: {
        filename: 'hotloader.js',
        // the output bundle
        path: resolve(__dirname, 'dist'),
        publicPath: '/'
        // necessary for HMR to know where to load the hot update chunks
    },
    devtool: 'inline-source-map',
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },
    devServer: {
        port: '8070',
        // Change it if other port needs to be used
        hot: true,
        // enable HMR on the server
        noInfo: true,
        quiet: false,
        // minimize the output to terminal.
        contentBase: resolve(__dirname, 'src'),
        // match the output path
        publicPath: '/'
        // match the output `publicPath`
    },
    module: {
        rules: [
            {
                enforce: "pre",
                test: /\.(ts|tsx)?$/,
                loader: 'tslint-loader',
                exclude: [resolve(__dirname, "node_modules")],
            },
            {
                test: /\.(ts|tsx)?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            getCustomTransformers: () => ({
                              before: [ tsImportPluginFactory({
                                libraryName: 'antd',
                                libraryDirectory: 'es',
                                style: 'css',
                              }) ]
                            }),
                            compilerOptions: {
                              module: 'es2015'
                            }
                        },
                    },
                ],
                exclude: [resolve(__dirname, "node_modules")],
            },
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
            // {
            //     test:/\.css$/,
            //     // use: ['css-hot-loader']
            //     use: ['css-hot-loader', 'style-loader', MiniCssExtractPlugin.loader, "css-loader"]
            // },
            {
                test:/\.(css|scss)$/,
                // use: ['css-hot-loader']
                use: ['css-hot-loader', 'style-loader', "css-loader", "sass-loader"]
            },
            { test: /\.png$/, loader: "url-loader?limit=100000" },
            { test: /\.jpg$/, loader: "file-loader" },
            { test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/octet-stream' },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=image/svg+xml' }
        ]
    },
    plugins: [
        // new MiniCssExtractPlugin({
        //     filename: "style.css",
        //     chunkFilename: "[id].css"
        //   }),
        new webpack.HotModuleReplacementPlugin(),
        // enable HMR globally
        new webpack.NamedModulesPlugin(),
        // prints more readable module names in the browser console on HMR updates
        new HtmlWebpackPlugin({template: resolve(__dirname, 'src/index.html')}),
        // inject <script> in html file.
        new OpenBrowserPlugin({url: 'http://localhost:8070'}),
        new webpack.DefinePlugin({
          "process.env.EMPIRICAL_BASE_URL": JSON.stringify('http://localhost:3000'),
          "process.env.QUILL_GRAMMAR_URL": JSON.stringify('http://localhost:7000/#'),
          "process.env.QUILL_CDN_URL": JSON.stringify('http://localhost:45537')
        })
    ],
    node: {
      console: true,
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    }
};
