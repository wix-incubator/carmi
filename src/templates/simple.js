const template = Object.assign({}, require('./naive'));

template.topLevel = function topLevel() {
  function $$FUNCNAMEBuild() {
    $res.$FUNCNAME = $EXPR;
  }
};

module.exports = template;
