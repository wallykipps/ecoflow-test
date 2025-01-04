"use client"; // Marking this file as a client-side component

import { useState, useEffect } from 'react';
import { Form, Row, Col } from 'react-bootstrap'; // Importing Bootstrap components
import 'bootstrap/dist/css/bootstrap.min.css';

const SmartPlugData = () => {
  const currentDate = new Date().toISOString().split("T")[0]; // Get the current date in YYYY-MM-DD format
  const [deviceData, setDeviceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(currentDate); // Default start date
  const [endDate, setEndDate] = useState(currentDate); // Default end date

  // Function to fetch data based on selected dates
  const fetchData = async () => {
    try {
      setLoading(true); // Start loading
      const response = await fetch(`/api/smart-plug?dataType=deviceData&startDate=${startDate}&endDate=${endDate}`);
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
  };

  // Fetch data whenever startDate or endDate changes
  useEffect(() => {
    fetchData();
  }, [startDate, endDate]); // Dependency array triggers fetchData when dates change

  // Handle start date change
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  // Handle end date change
  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  // Handle form submission (if needed)
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData(); // Trigger data fetch when form is submitted (optional, if you want a button)
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Device Data</h2>

      {/* Row for the date filters form */}
      <Row className="mb-4">
        <Col>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="startDate">
              <Form.Label>Start Date</Form.Label>
              <Form.Control 
                type="date" 
                value={startDate} 
                onChange={handleStartDateChange} 
              />
            </Form.Group>

            <Form.Group controlId="endDate">
              <Form.Label>End Date</Form.Label>
              <Form.Control 
                type="date" 
                value={endDate} 
                onChange={handleEndDateChange} 
              />
            </Form.Group>
          </Form>
        </Col>
      </Row>

      {/* Row for the table displaying the data */}
      <Row>
        <Col>
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
        </Col>
      </Row>
    </div>
  );
};

export default SmartPlugData;
