'use strict'

import $ from 'jquery'
import Blockly from 'node-blockly/browser'
import './generator'

Blockly.Blocks['biyam_procedure'] = {
  init: function () {
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
  },
  domToMutation: function (dom) {
    var thisBlock = this
    var $mutation = $(dom)
    this.setColour($(dom).attr('hue'))
    Blockly.Events.disable()
    try {
      if ($mutation.prop('inline')) {
        this.setInputsInline(true)
      } else {
        this.setInputsInline(false)
      }
      $mutation.find('arg').each((idx, arg) => {
        let field = thisBlock.getField('ARGNAME-' + idx)
        if (field) {
          field.setValue($(arg).attr('name'))
        } else {
          field = new Blockly.FieldLabel($(arg).attr('name'))
          if ($(arg).find('item').length > 0) {
            let options = Array.map($(arg).find('item'), item => [$(item).text(), $(item).attr('value')])
            thisBlock.appendDummyInput()
              .setAlign(Blockly.ALIGN_RIGHT)
              .appendField(field, 'ARGNAME-' + idx)
              .appendField(new Blockly.FieldDropdown(options), 'ARG-' + idx)
          } else if ($(arg).attr('type') === 'Check') {
            thisBlock.appendDummyInput()
              .appendField(field, 'ARGNAME-' + idx)
              .appendField(new Blockly.FieldCheckbox('TRUE'), 'ARG-' + idx)
          } else {
            thisBlock.appendValueInput('ARG-' + idx)
              .setCheck($(arg).attr('type') || null)
              .setAlign(Blockly.ALIGN_RIGHT)
              .appendField(field, 'ARGNAME-' + idx)
          }
          thisBlock.getFieldValue('ARGNAME-' + idx, $(arg).attr('name'))
        }
      })
      var argCnt = $mutation.find('arg').length
      if (argCnt === 0) {
        thisBlock.appendDummyInput().appendField($mutation.attr('name'), 'NAME')
      } else {
        thisBlock.inputList[0].insertFieldAt(0, new Blockly.FieldLabel($mutation.attr('name')), 'NAME')
      }
      this.$mutation = $mutation
    } finally {
      Blockly.Events.enable()
    }
  },
  mutationToDom: function () {
    return this.$mutation[0]
  }
}

Blockly.Blocks['biyam_procedure_ret'] = {
  init: function () {
    this.setOutput(true, null)
  },
  domToMutation: function (dom) {
    Blockly.Blocks.biyam_procedure.domToMutation.apply(this, [dom])
    this.setOutput(true, JSON.parse($(dom).attr('ret_type') || 'null'))
  },
  mutationToDom: Blockly.Blocks.biyam_procedure.mutationToDom
}

function registerBiyamToolboxCategoryCallbacks (biyam) {
  var i = 0
  let cnt = Object.keys(biyam.procedure).length
  if (cnt > 1) cnt--
  for (let [cat, procedures] of Object.entries(biyam.procedure)) {
    let i_ = i
    biyam.workspace.registerToolboxCategoryCallback('BIYAM-' + i, function () {
      var procedureList = []
      for (var proc in procedures) {
        procedureList.push(proc)
      }

      function genProc (name, proc, ret) {
        let block = $('<block/>').attr('type', 'biyam_procedure' + (ret ? '_ret' : '')).attr('gap', 16)
        let mutation = $('<mutation/>').attr('name', name).attr('cat', cat).attr('hue', i_ * 360 / cnt).appendTo(block)
        if (ret && proc.ret_type) {
          mutation.attr('ret', JSON.stringify(proc.ret_type))
        }

        let argspec = (proc.args || []).map(arg => typeof (arg) === 'string' ? {name: arg} : arg)
        if (proc.inline === true) {
          mutation.prop('inline', true)
        } else if (proc.inline === false) {
          mutation.prop('inline', false)
        } else if (argspec.length === 1) {
          mutation.prop('inline', false)
        } else {
          mutation.prop('inline', true)
        }

        for (let [idx, arg] of Object.entries(argspec)) {
          var $arg = $('<arg/>').attr('name', arg.name).appendTo(mutation)
          if (arg.type === 'Check') {
            $arg.attr('type', 'Check')
          } else if (arg.type === 'Number') {
            $arg.attr('type', arg.type)
            $('<value/>').attr('name', 'ARG-' + idx).append(
              $('<shadow/>').attr('type', 'math_number').append(
                $('<field/>').attr('name', 'NUM').text('1')
              )
            ).appendTo(block)
          } else if (arg.type === 'String') {
            $arg.attr('type', arg.type)
            $('<value/>').attr('name', 'ARG-' + idx).append(
              $('<shadow/>').attr('type', 'text').append(
                $('<field/>').attr('name', 'TEXT').text('abc')
              )
            ).appendTo(block)
          } else if (typeof (arg.type) === 'object') {
            for (var key in arg.type) {
              $arg.append($('<item/>').attr('value', JSON.stringify(key)).text(arg.type[key]))
            }
          }
        }

        return block[0]
      }

      return $.map($.unique(procedureList), proc => {
        var proc_ = procedures[proc]
        var ret = []
        if (proc_.no_func !== true) {
          ret.push(genProc(proc, proc_, true))
        }
        if (proc_.no_proc !== true) {
          ret.push(genProc(proc, proc_, false))
        }
        return ret
      })
    })
    i++
  }
}

export { registerBiyamToolboxCategoryCallbacks }
