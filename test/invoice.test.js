var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('CURRENT BEHAVIOUR — invoice matches order pricing for an HSN-rated item', function () {
  var order = {
    items: [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }],
    coupon: ''
  };
  var billed = pricing.computeTotals(order.items, order.coupon);
  var invoiced = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    { subtotal: invoiced.subtotal, discount: invoiced.discount, tax: invoiced.tax, cgst: invoiced.cgst, sgst: invoiced.sgst, total: invoiced.total },
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, cgst: billed.cgst, sgst: billed.sgst, total: billed.total }
  );
  assert.equal(invoiced.rows[0].gstPercent, 5);
  assert.equal(invoiced.rows[0].lineTax, 5);
});

test('CURRENT BEHAVIOUR — invoice applies coupon discount and GST like order pricing', function () {
  var items = [{ id: 2, name: 'Rice', hsn: '1006', price: 600, qty: 1 }];

  var billed = pricing.computeTotals(items, 'SAVE10');
  var invoiced = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.deepEqual(
    { discount: billed.discount, tax: billed.tax, total: billed.total },
    { discount: 60, tax: 27, total: 567 }
  );
  assert.deepEqual(
    { discount: invoiced.discount, tax: invoiced.tax, total: invoiced.total },
    { discount: 60, tax: 27, total: 567 }
  );
  assert.equal(invoiced.rows[0].lineTax, billed.lines[0].tax);
});

test('CURRENT BEHAVIOUR — rendered invoice displays billed total without a mismatch notice', function () {
  var html = invoice.render({
    id: 1001,
    date: '2026-11-21',
    items: [{ name: 'Rice', hsn: '1006', price: 100, qty: 1 }],
    subtotal: 100,
    discount: 0,
    tax: 5,
    total: 105
  });

  assert.match(html, /Invoice Total<\/td><td class="r">\u20b9105\.00/);
  assert.match(html, /<td class="r">5%<\/td>/);
  assert.match(html, /CGST \+ SGST \(Total GST\)<\/td><td class="r">\u20b95\.00/);
  assert.match(html, /GST Amt<\/th>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
