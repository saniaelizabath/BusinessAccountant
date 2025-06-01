import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { Typography, Box, Grid, TextField, Button } from '@mui/material';

const CustomerOrders = () => {
  const [userId, setUserId] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [totalBalance, setTotalBalance] = useState(0);
  const printRef = useRef();

  const [formData, setFormData] = useState({
    orderDate: '',
    customerName: '',
    address: '',
    number: '',
    itemName: '',
    itemDescription: '',
    rate: '',
    quantity: '',
    discount: '',
    advance: '',
    amountGiven: ''
  });

  // Filter states
  const [searchMonthYear, setSearchMonthYear] = useState('');
  const [searchCustomerName, setSearchCustomerName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userId) return;
      const userProductsRef = collection(db, 'users', userId, 'products');
      const snapshot = await getDocs(userProductsRef);
      const data = snapshot.docs.map(doc => doc.data());
      setProducts(data);
    };
    fetchProducts();
  }, [userId]);

  // Extract fetchOrders as a separate function
  const fetchOrders = async () => {
    if (!userId) return;
    const ordersRef = collection(db, 'users', userId, 'customerOrders');
    const snapshot = await getDocs(query(ordersRef, orderBy('timestamp', 'desc')));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setOrders(data);
  };

  // Fetch payments
  const fetchPayments = async () => {
    if (!userId) return;
    const paymentsRef = collection(db, 'users', userId, 'payments');
    const snapshot = await getDocs(query(paymentsRef, orderBy('timestamp', 'desc')));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPayments(data);
  };

  useEffect(() => {
    fetchOrders();
    fetchPayments();
  }, [userId]);

  useEffect(() => {
    const { itemName, itemDescription } = formData;
    const matchedProduct = products.find(p =>
      p.itemName === itemName && p.itemDescription === itemDescription
    );
    if (matchedProduct) {
      setFormData(prev => ({
        ...prev,
        rate: matchedProduct.rate || 0
      }));
    }
  }, [formData.itemName, formData.itemDescription, products]);

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!userId) return;

    const { rate, quantity, discount, advance, amountGiven } = formData;
    const totalAmount = rate * quantity - (discount + advance);
    const balance = totalAmount - amountGiven;

    const orderData = {
      ...formData,
      rate: Number(rate),
      quantity: Number(quantity),
      discount: Number(discount),
      advance: Number(advance),
      amountGiven: Number(amountGiven),
      totalAmount,
      balance,
      timestamp: Timestamp.now()
    };

    try {
      const ordersRef = collection(db, 'users', userId, 'customerOrders');
      await addDoc(ordersRef, orderData);
      
      // Refresh orders after adding
      fetchOrders();
      
      setFormData({
        orderDate: '',
        customerName: '',
        address: '',
        number: '',
        itemName: '',
        itemDescription: '',
        rate: '',
        quantity: '',
        discount: '',
        advance: '',
        amountGiven: ''
      });
    } catch (error) {
      console.error('Error adding order:', error);
    }
  };

  const calculatedTotal = formData.rate * formData.quantity - (Number(formData.discount) + Number(formData.advance));
  const calculatedBalance = calculatedTotal - Number(formData.amountGiven);

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Bill</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Filter function for both orders and payments
  useEffect(() => {
    let filteredOrdersData = [...orders];
    let filteredPaymentsData = [...payments];
  
    // Apply date filters
    if (filterType === 'day') {
      const now = new Date();
      filteredOrdersData = filteredOrdersData.filter(order => {
        const date = new Date(order.orderDate);
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
      filteredPaymentsData = filteredPaymentsData.filter(payment => {
        const date = new Date(payment.paymentDate);
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    } else if (filterType === 'month') {
      const now = new Date();
      filteredOrdersData = filteredOrdersData.filter(order => {
        const date = new Date(order.orderDate);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
      filteredPaymentsData = filteredPaymentsData.filter(payment => {
        const date = new Date(payment.paymentDate);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    } else if (filterType === 'specific' && filterDate) {
      filteredOrdersData = filteredOrdersData.filter(order => order.orderDate === filterDate);
      filteredPaymentsData = filteredPaymentsData.filter(payment => payment.paymentDate === filterDate);
    }
  
    // Apply month/year search
    if (searchMonthYear) {
      const [year, month] = searchMonthYear.split('-').map(Number);
      filteredOrdersData = filteredOrdersData.filter(order => {
        const date = new Date(order.orderDate);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      });
      filteredPaymentsData = filteredPaymentsData.filter(payment => {
        const date = new Date(payment.paymentDate);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      });
    }
  
    // Apply customer name filter
    if (searchCustomerName.trim()) {
      filteredOrdersData = filteredOrdersData.filter(order =>
        order.customerName?.toLowerCase().includes(searchCustomerName)
      );
      filteredPaymentsData = filteredPaymentsData.filter(payment =>
        payment.customerName?.toLowerCase().includes(searchCustomerName)
      );
    }

    setFilteredOrders(filteredOrdersData);
    setFilteredPayments(filteredPaymentsData);
    
    // Calculate total balance considering both orders and payments
    const totalOrderBalance = filteredOrdersData.reduce((acc, order) => acc + parseFloat(order.balance || 0), 0);
    const totalPayments = filteredPaymentsData.reduce((acc, payment) => acc + parseFloat(payment.amount || 0), 0);
    const calculatedTotalBalance = totalOrderBalance - totalPayments;
    setTotalBalance(calculatedTotalBalance);
  }, [orders, payments, filterType, filterDate, searchMonthYear, searchCustomerName]);

  const handlePayment = async () => {
    if (!paymentAmount || !paymentDate || !searchCustomerName) {
      alert("Please enter payment amount, date, and make sure a customer is selected.");
      return;
    }

    try {
      // Add payment record
      const paymentData = {
        customerName: searchCustomerName,
        amount: parseFloat(paymentAmount),
        paymentDate: paymentDate,
        timestamp: Timestamp.now()
      };

      const paymentsRef = collection(db, 'users', userId, 'payments');
      await addDoc(paymentsRef, paymentData);

      alert("Payment recorded successfully.");
      setPaymentAmount('');
      setPaymentDate('');
      
      // Refresh data
      fetchPayments();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert("Error recording payment. Please try again.");
    }
  };

  // Combine and sort orders and payments for display
  const combinedData = [
    ...filteredOrders.map(order => ({ 
      ...order, 
      type: 'order',
      date: order.orderDate,
      sortDate: new Date(order.orderDate)
    })),
    ...filteredPayments.map(payment => ({ 
      ...payment, 
      type: 'payment',
      date: payment.paymentDate,
      sortDate: new Date(payment.paymentDate)
    }))
  ].sort((a, b) => b.sortDate - a.sortDate);
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Add Customer Order</h2>

      <form onSubmit={handleSubmit}>
        <table className="table-auto w-full mb-4 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Customer Name</th>
              <th className="p-2 border">Address</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Item Name</th>
              <th className="p-2 border">Item Description</th>
              <th className="p-2 border">Rate</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">Discount</th>
              <th className="p-2 border">Advance</th>
              <th className="p-2 border">Amount Given</th>
              <th className="p-2 border">Total Amount</th>
              <th className="p-2 border">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border"><input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} required className="border p-1" /></td>
              <td className="p-2 border"><input name="customerName" value={formData.customerName} onChange={handleChange} required className="border p-1" /></td>
              <td className="p-2 border"><input name="address" value={formData.address} onChange={handleChange} className="border p-1" /></td>
              <td className="p-2 border"><input name="number" value={formData.number} onChange={handleChange} className="border p-1" /></td>
              <td className="p-2 border">
                <input list="productNames" name="itemName" value={formData.itemName} onChange={handleChange} className="border p-1" />
                <datalist id="productNames">
                  {Array.from(new Set(products.map(p => p.itemName))).map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>
              </td>
              <td className="p-2 border">
                <input list="productDescriptions" name="itemDescription" value={formData.itemDescription} onChange={handleChange} className="border p-1" />
                <datalist id="productDescriptions">
                  {products
                    .filter(p => p.itemName === formData.itemName)
                    .map((p, i) => <option key={i} value={p.itemDescription} />)}
                </datalist>
              </td>
              <td className="p-2 border"><input name="rate" type="number" value={formData.rate} readOnly className="border p-1 bg-gray-100" /></td>
              <td className="p-2 border"><input name="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border"><input name="discount" type="number" value={formData.discount} onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border"><input name="advance" type="number" value={formData.advance} onChange={(e) => setFormData(prev => ({ ...prev, advance: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border"><input name="amountGiven" type="number" value={formData.amountGiven} onChange={(e) => setFormData(prev => ({ ...prev, amountGiven: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border bg-gray-100">{calculatedTotal || 0}</td>
              <td className="p-2 border bg-gray-100">{calculatedBalance || 0}</td>
            </tr>
          </tbody>
        </table>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Order</button>
      </form>

      <div className="mt-8" ref={printRef}>
        <h2 className="text-center text-xl font-bold">Johnsons Cement Products</h2>
        <h3 className="text-lg font-semibold mt-4">Customer Bill</h3>
        <table className="w-full border mt-2">
          <tbody>
            <tr><td className="border p-2">Customer Name</td><td className="border p-2">{formData.customerName}</td></tr>
            <tr><td className="border p-2">Address</td><td className="border p-2">{formData.address}</td></tr>
            <tr><td className="border p-2">Phone</td><td className="border p-2">{formData.number}</td></tr>
            <tr><td className="border p-2">Item</td><td className="border p-2">{formData.itemName}</td></tr>
            <tr><td className="border p-2">Description</td><td className="border p-2">{formData.itemDescription}</td></tr>
            <tr><td className="border p-2">Rate</td><td className="border p-2">{formData.rate}</td></tr>
            <tr><td className="border p-2">Quantity</td><td className="border p-2">{formData.quantity}</td></tr>
            <tr><td className="border p-2">Discount</td><td className="border p-2">{formData.discount}</td></tr>
            <tr><td className="border p-2">Advance</td><td className="border p-2">{formData.advance}</td></tr>
            <tr><td className="border p-2">Amount Given</td><td className="border p-2">{formData.amountGiven}</td></tr>
            <tr><td className="border p-2 font-bold">Total Amount</td><td className="border p-2 font-bold">{calculatedTotal}</td></tr>
            <tr><td className="border p-2 font-bold">Balance</td><td className="border p-2 font-bold">{calculatedBalance}</td></tr>
          </tbody>
        </table>
      </div>

      <button onClick={handlePrint} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">Print Bill</button>

      <div className="my-6">
        <label className="mr-2 font-semibold">Filter Orders:</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border p-1 mr-2">
          <option value="all">All</option>
          <option value="day">Records of the Day</option>
          <option value="month">Records of the Month</option>
          <option value="specific">Search by Specific Date</option>
        </select>
        {filterType === 'specific' && (
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="border p-1"
          />
        )}
      </div>
      
      <div className="my-4 flex flex-wrap gap-4">
        <div>
          <label className="mr-2 font-medium">Filter by Month/Year:</label>
          <input
            type="month"
            value={searchMonthYear}
            onChange={e => setSearchMonthYear(e.target.value)}
            className="border p-1"
          />
        </div>
        <div>
          <label className="mr-2 font-medium">Filter by Customer Name:</label>
          <input
            type="text"
            placeholder="Enter customer name"
            value={searchCustomerName}
            onChange={e => setSearchCustomerName(e.target.value.toLowerCase())}
            className="border p-1"
          />
        </div>
      </div>

      {/* Combined Orders and Payments Table */}
      <h3 className="text-lg font-semibold mt-6 mb-2">Orders & Payment Records</h3>
      <table className="min-w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Type</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Customer Name</th>
            <th className="border p-2">Address</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Item</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Discount</th>
            <th className="border p-2">Advance</th>
            <th className="border p-2">Amount Given</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Balance/Payment</th>
          </tr>
        </thead>
        <tbody>
          {combinedData.map((record, idx) => (
            <tr key={`${record.type}-${idx}`} className={record.type === 'payment' ? 'bg-green-50' : ''}>
              <td className="border p-2 font-semibold">
                {record.type === 'order' ? (
                  <span className="text-blue-600">ORDER</span>
                ) : (
                  <span className="text-green-600">PAYMENT</span>
                )}
              </td>
              <td className="border p-2">{record.date}</td>
              <td className="border p-2">{record.customerName}</td>
              {record.type === 'order' ? (
                <>
                  <td className="border p-2">{record.address}</td>
                  <td className="border p-2">{record.number}</td>
                  <td className="border p-2">{record.itemName}</td>
                  <td className="border p-2">{record.itemDescription}</td>
                  <td className="border p-2">{record.rate}</td>
                  <td className="border p-2">{record.quantity}</td>
                  <td className="border p-2">{record.discount}</td>
                  <td className="border p-2">{record.advance}</td>
                  <td className="border p-2">{record.amountGiven}</td>
                  <td className="border p-2">{record.totalAmount}</td>
                  <td className="border p-2 text-red-600 font-semibold">₹{record.balance}</td>
                </>
              ) : (
                <>
                  <td className="border p-2 text-gray-400">-</td>
                  <td className="border p-2 text-gray-400">-</td>
                  <td className="border p-2 text-gray-400">-</td>
                  <td className="border p-2 text-gray-400">-</td>
                  <td className="border p-2 text-gray-400">-</td>
                  <td className="border p-2 text-gray-400">-</td>
                  <td className="border p-2 text-gray-400">-</td>
                  <td className="border p-2 text-gray-400">-</td>
                  <td className="border p-2 text-gray-400">-</td>
                  <td className="border p-2 text-green-600 font-semibold">-₹{record.amount}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      <Typography variant="h6" style={{ marginTop: 16, color: totalBalance >= 0 ? 'red' : 'green' }}>
        Net Balance: ₹{totalBalance.toFixed(2)} {totalBalance < 0 ? '(Overpaid)' : '(Due)'}
      </Typography>

      {searchCustomerName && filteredOrders.length > 0 && (
        <Box mt={4} p={3} border="1px solid #ccc" borderRadius={2}>
          <Typography variant="h6" gutterBottom>
            Record Payment for {searchCustomerName}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Payment Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Payment Date"
                InputLabelProps={{ shrink: true }}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={handlePayment}>
                Record Payment
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}
    </div>
  );
};

export default CustomerOrders;