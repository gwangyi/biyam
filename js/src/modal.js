'use strict'

import $ from 'jquery'
import modal from './modal.tpl.html'

const $modal = $(modal).appendTo($('body')).hide()

$modal.find('form').on('submit', () => false)

function modalPrompt (msg, callback) {
  $modal.find('form').off('submit')
  $modal.find('#biyamPromptText').val('')
  $modal.off('hidden.bs.modal')
  var ret = [null]
  $modal.find('form').on('submit', function () {
    $modal.modal('hide')
    ret.push($modal.find('#biyamPromptText').val())
    return false
  })
  $modal.on('hidden.bs.modal', function () {
    $modal.off('hidden.bs.modal')
    callback(ret.pop())
  })
  $modal.find('label').text(msg)
  $modal.modal()
}

$modal.keypress(function (e) { e.stopPropagation() })
  .keyup(function (e) { e.stopPropagation() })
  .keydown(function (e) { e.stopPropagation() })

export default modalPrompt
