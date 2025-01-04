"use client"; // Marking this file as a client-side component

import { useState, useEffect } from 'react';
import { Form, Row, Col } from 'react-bootstrap'; // Importing Bootstrap components
import 'bootstrap/dist/css/bootstrap.min.css';

const SmartPlugData = () => {
  const currentDate = new Date().toISOString().split("T")[0]; // Get the current date in YYYY-MM-DD format
  const [deviceData, setDeviceData] = useState([]);
  const [aggregatedData, setAggregatedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(currentDate); // Default start date
  const [endDate, setEndDate] = useState(currentDate); // Default end date
  const [dataType, setDataType] = useState('aggregated'); // Default data type is 'aggregated'
  const [aggregationType, setAggregationType] = useState('hour'); // Default aggregation type

  // Function to fetch device data or aggregated data based on dataType and aggregationType
  const fetchData = async () => {
    try {
      setLoading(true); // Start loading
      let url = `/api/smart-plug?startDate=${startDate}&endDate=${endDate}&dataType=${dataType}`;
      
      if (dataType === 'aggregated') {
        url += `&aggregationType=${aggregationType}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Error fetching aggregated data');
        }
        const data = await response.json();
        setAggregatedData(data); // Update state with aggregated data
      } else if (dataType === 'deviceData') {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Error fetching device data');
        }
        const data = await response.json();
        setDeviceData(data); // Update state with device data
      }
    } catch (err) {
      setError(err.message); // Set error state if an error occurs
    } finally {
      setLoading(false); // Set loading to false after the fetch is complete
    }
  };

  // Fetch data whenever startDate, endDate, dataType, or aggregationType changes
  useEffect(() => {
    fetchData();
  }, [startDate, endDate, dataType, aggregationType]); // Dependency array triggers fetchData when any of these change

  // Handle start date change
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  // Handle end date change
  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  // Handle data type change
  const handleDataTypeChange = (e) => {
    setDataType(e.target.value);
  };

  // Handle aggregation type change
  const handleAggregationTypeChange = (e) => {
    setAggregationType(e.target.value);
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
      <h2>Smart Plug Data</h2>

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

            {/* Select Data Type */}
            <Form.Group controlId="dataType">
              <Form.Label>Data Type</Form.Label>
              <Form.Control as="select" value={dataType} onChange={handleDataTypeChange}>
                <option value="aggregated">Aggregated Data</option>
                <option value="deviceData">Device Data</option>
              </Form.Control>
            </Form.Group>

            {/* Select Aggregation Type (only appears when 'aggregated' is selected) */}
            {dataType === 'aggregated' && (
              <Form.Group controlId="aggregationType">
                <Form.Label>Aggregation Type</Form.Label>
                <Form.Control as="select" value={aggregationType} onChange={handleAggregationTypeChange}>
                  <option value="minute">Minute</option>
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </Form.Control>
              </Form.Group>
            )}
          </Form>
        </Col>
      </Row>

      {/* Unified Table for Aggregated or Device Data */}
      <Row>
        <Col>
          <h3>{dataType === 'aggregated' ? `Aggregated Data (${aggregationType})` : 'Device Data'}</h3>
          <table>
            <thead>
              <tr>
                {dataType === 'aggregated' ? (
                  <>
                    <th>Time</th>
                    <th>Avg Watts</th>
                    <th>Max Watts</th>
                    <th>Min Watts</th>
                    <th>Avg Voltage</th>
                    <th>Avg Current</th>
                    <th>Count</th>
                    <th>Duration (Seconds)</th>
                    <th>Wh</th>
                    <th>kWh</th>
                  </>
                ) : (
                  <>
                    <th>Time</th>
                    <th>Switch Status</th>
                    <th>Country</th>
                    <th>Town</th>
                    <th>Volt</th>
                    <th>Current</th>
                    <th>Watts</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {dataType === 'aggregated'
                ? aggregatedData.map((data, index) => (
                    <tr key={index}>
                      <td>{data.time}</td>
                      <td>{data.volt}</td>
                      <td>{data.current}</td>
                      <td>{data.watts}</td>
                      <td>{data.maxWatts}</td>
                      <td>{data.minWatts}</td>
                      <td>{data.count}</td>
                      <td>{data.durationInSeconds}</td>
                      <td>{data.watthours}</td>
                      <td>{data.watthours/1000}</td>
                    </tr>
                  ))
                : deviceData.map((data, index) => (
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
