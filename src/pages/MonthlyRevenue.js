import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import dayjs from 'dayjs';

function MonthlyRevenue() {
  const [userId, setUserId] = useState(null);
  const [monthlyData, setMonthlyData] = useState({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        await calculateMonthlyRevenue(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const calculateMonthlyRevenue = async (uid) => {
    const ordersSnap = await getDocs(collection(db, 'users', uid, 'customerOrders'));
    const materialsSnap = await getDocs(collection(db, 'users', uid, 'raw_material_purchases'));
    const wagesSnap = await getDocs(collection(db, 'users', uid, 'employees'));

    const data = {};

    // Aggregate Orders (Income)
    ordersSnap.forEach(doc => {
      const { totalAmount = 0, date } = doc.data();
      if (!date) return;
      const month = dayjs(date.toDate()).format('YYYY-MM');
      if (!data[month]) data[month] = { income: 0, materials: 0, wages: 0 };
      data[month].income += totalAmount;
    });

    // Aggregate Raw Material Expenses
    materialsSnap.forEach(doc => {
      const { price = 0, quantity = 0, date } = doc.data();
      if (!date) return;
      const month = dayjs(date.toDate()).format('YYYY-MM');
      if (!data[month]) data[month] = { income: 0, materials: 0, wages: 0 };
      data[month].materials += price * quantity;
    });

    // Aggregate Employee Wages
    wagesSnap.forEach(doc => {
      const { wage = 0, date } = doc.data();
      if (!date) return;
      const month = dayjs(date.toDate()).format('YYYY-MM');
      if (!data[month]) data[month] = { income: 0, materials: 0, wages: 0 };
      data[month].wages += wage;
    });

    setMonthlyData(data);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Monthly Revenue Report</h2>
      <table className="table-auto w-full border-collapse border border-gray-400">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Month</th>
            <th className="border px-4 py-2">Income (Orders)</th>
            <th className="border px-4 py-2">Raw Material Cost</th>
            <th className="border px-4 py-2">Employee Wages</th>
            <th className="border px-4 py-2 font-semibold text-green-700">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(monthlyData).sort().map(([month, { income, materials, wages }]) => (
            <tr key={month}>
              <td className="border px-4 py-2">{month}</td>
              <td className="border px-4 py-2">₹{income.toFixed(2)}</td>
              <td className="border px-4 py-2">₹{materials.toFixed(2)}</td>
              <td className="border px-4 py-2">₹{wages.toFixed(2)}</td>
              <td className="border px-4 py-2 text-green-700 font-semibold">
                ₹{(income - materials - wages).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MonthlyRevenue;
