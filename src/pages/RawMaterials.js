import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

function RawMaterials() {
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState('');

  const [purchaseDate, setPurchaseDate] = useState('');
  const [usageDate, setUsageDate] = useState('');

  const [purchaseItems, setPurchaseItems] = useState([{ material: '', quantity: '', price: '' }]);
  const [usageItems, setUsageItems] = useState([{ material: '', quantity: '' }]);

  const [availableMaterials, setAvailableMaterials] = useState({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        calculateAvailableQuantities(user.uid);
      } else {
        setUserId(null);
        setAvailableMaterials({});
      }
    });

    return () => unsubscribe();
  }, []);

  const handlePurchaseChange = (index, field, value) => {
    const updated = [...purchaseItems];
    updated[index][field] = value;
    setPurchaseItems(updated);
  };

  const handleUsageChange = (index, field, value) => {
    const updated = [...usageItems];
    updated[index][field] = value;
    setUsageItems(updated);
  };

  const addPurchaseRow = () => setPurchaseItems([...purchaseItems, { material: '', quantity: '', price: '' }]);
  const removePurchaseRow = (index) => setPurchaseItems(purchaseItems.filter((_, i) => i !== index));

  const addUsageRow = () => setUsageItems([...usageItems, { material: '', quantity: '' }]);
  const removeUsageRow = (index) => setUsageItems(usageItems.filter((_, i) => i !== index));

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    if (!purchaseDate) {
      setMessage("Date is required.");
      return;
    }

    try {
      const batch = purchaseItems.filter(item => item.material && item.quantity && item.price);
      for (let item of batch) {
        await addDoc(collection(db, 'users', userId, 'raw_material_purchases'), {
          material: item.material,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price),
          date: Timestamp.fromDate(new Date(purchaseDate)),
        });
      }
      setPurchaseItems([{ material: '', quantity: '', price: '' }]);
      setPurchaseDate('');
      setMessage("Raw materials added.");
      calculateAvailableQuantities(userId);
    } catch (err) {
      console.error(err);
      setMessage("Error adding raw materials.");
    }
  };

  const handleAddUsage = async (e) => {
    e.preventDefault();
    if (!usageDate) {
      setMessage("Date is required.");
      return;
    }

    try {
      const batch = usageItems.filter(item => item.material && item.quantity);
      for (let item of batch) {
        await addDoc(collection(db, 'users', userId, 'raw_material_usages'), {
          material: item.material,
          quantity: parseFloat(item.quantity),
          date: Timestamp.fromDate(new Date(usageDate)),
        });
      }
      setUsageItems([{ material: '', quantity: '' }]);
      setUsageDate('');
      setMessage("Raw material usage recorded.");
      calculateAvailableQuantities(userId);
    } catch (err) {
      console.error(err);
      setMessage("Error recording usage.");
    }
  };

  const calculateAvailableQuantities = async (uid) => {
    const purchasesSnapshot = await getDocs(collection(db, 'users', uid, 'raw_material_purchases'));
    const usagesSnapshot = await getDocs(collection(db, 'users', uid, 'raw_material_usages'));

    const purchaseMap = {};
    purchasesSnapshot.forEach(doc => {
      const { material, quantity } = doc.data();
      if (!purchaseMap[material]) purchaseMap[material] = 0;
      purchaseMap[material] += quantity;
    });

    usagesSnapshot.forEach(doc => {
      const { material, quantity } = doc.data();
      if (!purchaseMap[material]) purchaseMap[material] = 0;
      purchaseMap[material] -= quantity;
    });

    setAvailableMaterials(purchaseMap);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <h2 className="text-2xl font-bold mb-4">Raw Material Management</h2>

      {message && <div className="text-green-600 mb-4">{message}</div>}

      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-2">Add Raw Material Purchases</h3>
        <form onSubmit={handleAddPurchase} className="space-y-4">
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="border p-2"
            required
          />
          {purchaseItems.map((item, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 items-center">
              <input
                type="text"
                placeholder="Material"
                value={item.material}
                onChange={(e) => handlePurchaseChange(index, 'material', e.target.value)}
                className="border p-2"
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={item.quantity}
                onChange={(e) => handlePurchaseChange(index, 'quantity', e.target.value)}
                className="border p-2"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={item.price}
                onChange={(e) => handlePurchaseChange(index, 'price', e.target.value)}
                className="border p-2"
                required
              />
              <button type="button" onClick={() => removePurchaseRow(index)} className="text-red-500">Remove</button>
            </div>
          ))}
          <button type="button" onClick={addPurchaseRow} className="bg-blue-500 text-white px-3 py-1 rounded">+ Add More</button>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded mt-2">Add Purchases</button>
        </form>
      </div>

      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-2">Enter Raw Material Usage</h3>
        <form onSubmit={handleAddUsage} className="space-y-4">
          <input
            type="date"
            value={usageDate}
            onChange={(e) => setUsageDate(e.target.value)}
            className="border p-2"
            required
          />
          {usageItems.map((item, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 items-center">
              <input
                type="text"
                placeholder="Material"
                value={item.material}
                onChange={(e) => handleUsageChange(index, 'material', e.target.value)}
                className="border p-2"
                required
              />
              <input
                type="number"
                placeholder="Quantity Used"
                value={item.quantity}
                onChange={(e) => handleUsageChange(index, 'quantity', e.target.value)}
                className="border p-2"
                required
              />
              <button type="button" onClick={() => removeUsageRow(index)} className="text-red-500">Remove</button>
            </div>
          ))}
          <button type="button" onClick={addUsageRow} className="bg-blue-500 text-white px-3 py-1 rounded">+ Add More</button>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded mt-2">Record Usage</button>
        </form>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Available Raw Material Stock</h3>
        {Object.keys(availableMaterials).length === 0 ? (
          <p>No data available.</p>
        ) : (
          <table className="table-auto w-full border border-collapse border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Material</th>
                <th className="border px-4 py-2">Available Quantity</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(availableMaterials).map(([name, qty]) => (
                <tr key={name}>
                  <td className="border px-4 py-2">{name}</td>
                  <td className="border px-4 py-2">{qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default RawMaterials;
