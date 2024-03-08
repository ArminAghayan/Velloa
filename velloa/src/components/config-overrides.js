const { override, fixBabelImports, addLessLoader } = require('customize-cra');

module.exports = override(
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    style: true, // change importing css to less
  }),
  addLessLoader({
    lessOptions: {
      javascriptEnabled: true,
      modifyVars: {
        '@primary-color': '#fa8c16', // Customize Ant Design theme here
        '@link-color': '#fa8c16',
        '@font-size-base': '14px',
        '@border-radius-base': '8px',
        // Add more Ant Design variables to customize
      },
    },
  }),
);
