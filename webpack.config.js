const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports ={
  mode:"development",
  context:__dirname,
  entry:"./src/TD/index.js",
  output:{
    filename:'[name].js',
    path:path.resolve(__dirname,"bin")
  },
  module:{
    rules:[{
      test:/\.css$/,
      use:['style-loader','css-loader']
    },{
      test:/\.(png|gif|jpg|jpeg|svg|xml|json|czml)$/,
      use:['url-loader']
    },{
      test:/\.js$/,
      use:['babel-loader']
    }]
  },
  plugins:[
    // new HtmlWebpackPlugin({
    //   template:'./public/index.html',
    //   filename:'index.html',
    //   inject:'body'
    // })
  ],
  devServer:{
    contentBase:path.join(__dirname,"bin")
  }
}