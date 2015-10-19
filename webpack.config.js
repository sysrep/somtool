module.exports = {
    entry: [
        "./src/app.js",
    ],
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                exclude: /(node_modules|bower_components)/,
                loader: "style!css"
            },
            {
                test: /\.js?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel?optional[]=runtime&stage=0'
            }
        ]
    }
};