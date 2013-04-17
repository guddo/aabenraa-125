<?php
function mkdru_admin_settings($form, &$form_state) {
  $form['pz2_js_path']=array(
    '#type' => 'textfield',
    '#title' => t('Path to Pazpar2 client library'),
    '#description' => t('Absolute path to the directory containing pz2.js within the current domain.'),
    '#default_value' => variable_get('pz2_js_path', '/pazpar2/js'),
    '#required' => TRUE
  );
  return system_settings_form($form);
}
