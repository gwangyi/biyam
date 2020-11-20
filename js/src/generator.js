'use strict'

import $ from 'jquery'
import Blockly from 'node-blockly/browser'

function _argBuilder (block, pairSep, argSep, primitiveConverter) {
  return $.map(block.$mutation.find('arg'), function (arg, idx) {
    if ($(arg).attr('type') === 'Check') {
      return $(arg).attr('name') + pairSep + (block.getFieldValue('ARG-' + idx) === 'TRUE' ? 'True' : 'False')
    } else if ($(arg).find('item').length > 0) {
      const val = JSON.parse(block.getFieldValue('ARG-' + idx))
      return $(arg).attr('name') + pairSep + primitiveConverter(val)
    } else {
      const code = Blockly.Python.valueToCode(block, 'ARG-' + idx, 99)
      if (code) { return $(arg).attr('name') + pairSep + code } else { return '' }
    }
  }).join(argSep)
}

function biyamProcedurePy (block) {
  const args = _argBuilder(block, '=', ', ', val => {
    if (typeof (val) === 'string') return '"' + val + '"'
    else return val
  })
  if (block.$mutation.attr('cat') === '__main__') {
    return block.getFieldValue('NAME') + '(' + args + ')'
  } else {
    return block.$mutation.attr('cat') + '.' + block.getFieldValue('NAME') + '(' + args + ')'
  }
}

function biyamProcedureJs (block) {
  const args = _argBuilder(block, ': ', ', ', JSON.stringify)
  return '_biyamRpc("' + block.$mutation.attr('cat') + '", "' + block.getFieldValue('NAME') + '", {' + args + '})'
}

Blockly.Python.biyam_procedure = function (block) {
  return biyamProcedurePy(block) + '\n'
}

Blockly.Python.biyam_procedure_ret = function (block) {
  return [biyamProcedurePy(block), Blockly.Python.ORDER_FUNCTION_CALL]
}

Blockly.Python.INDENT = '    '

Blockly.JavaScript.biyam_procedure = function (block) {
  return biyamProcedureJs(block) + ';\n'
}

Blockly.JavaScript.biyam_procedure_ret = function (block) {
  return [biyamProcedureJs(block), Blockly.Python.ORDER_FUNCTION_CALL]
}
