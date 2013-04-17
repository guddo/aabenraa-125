<?php
/**
 * @file
 * Payment provider implementation for Ding!
 */

/**
 * Generate the payment URL to redirect the user to.
 */
function ding_dibs_payment_get_url($amount, $params, $callback) {
// pjo tampering
//  if (!empty($params['params']['debt_ids'])) {
  if( !empty($params['params']['debts']) ) {
    $index = 0;
    $params['order_info_long'][] = array(t('Title'),t('Date'),t('Amount'));
    foreach( $params['params']['debts'] as $key => $obj ) {
      // dpm((array)$params['params']['debts'][$key]);
      $params['order_info_long'][] = array($obj->display_name, $obj->date, $obj->amount . '.00');
    }
    // pjo @TODO do a proper orderinfo here. like
    /*'order_info_long'     => array(
      array('Qty', 'Text', 'Price'),
      array('1', 'Prduct #1', '12.00'),
      array('4', 'Prduct #2', '6.00'),
      array('2', 'Prduct #5', '9.00'),
      ), */

    /*  $params['order_info_long'] = t('Payment of library dues: @debts', array('@debts' => implode(',', $params['params']['debt_ids'])));*/
  }

  $transaction_hash = ding_dibs_payment_prepare($amount, $params, $callback, FALSE);

  return 'payment/dibs/redirect/' . $transaction_hash;
}

