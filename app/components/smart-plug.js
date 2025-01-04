// components/SmartPlugData.js
"use client"; // Marking this file as a client-side component

import { useState, useEffect } from 'react';

const SmartPlugData = () => {
  const [deviceData, setDeviceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log(deviceData);

  // Fetch data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Replace with your endpoint to fetch device data
        const response = await fetch('/api/smart-plug?dataType=deviceData&startDate=2025-01-01&endDate=2025-01-04');
        if (!response.ok) {
          throw new Error('Error fetching data');
        }
        const data = await response.json();
        setDeviceData(data); // Update state with fetched data
      } catch (err) {
        setError(err.message); // Set error state if an error occurs
      } finally {
        setLoading(false); // Set loading to false after the fetch is complete
      }
    }

    fetchData();
  }, []); // Empty dependency array means this runs only once when the component mounts

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Device Data</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Switch Status</th>
            <th>Country</th>
            <th>Town</th>
            <th>Volt</th>
            <th>Current</th>
            <th>Watts</th>
          </tr>
        </thead>
        <tbody>
          {deviceData.map((data, index) => (
            <tr key={index}>
              <td>{data.updateTime}</td>
              <td>{data.switchStatus}</td>
              <td>{data.country}</td>
              <td>{data.town}</td>
              <td>{data.volt}</td>
              <td>{data.current}</td>
              <td>{data.watts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SmartPlugData;
