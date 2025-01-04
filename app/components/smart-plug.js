"use client"; // Marking this file as a client-side component

import { useState, useEffect } from 'react';
import { Form, Row, Col } from 'react-bootstrap'; // Importing Bootstrap components
import DataTable from 'react-data-table-component'; // Importing react-data-table-component
import ApexCharts from 'react-apexcharts'; // Importing react-apexcharts for charting
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

  // Define columns for the DataTable based on the data type (collapsed version)
  const columns = dataType === 'aggregated'
    ? [
        { name: 'Time', selector: row => row.time, sortable: true },
        { name: 'Voltage', selector: row => row.volt.toFixed(0), sortable: true },
        { name: 'Current', selector: row => (row.current / 1000).toFixed(2), sortable: true },
        { name: 'Average Watts', selector: row => row.watts.toFixed(1), sortable: true },
        { name: 'Max Watts', selector: row => row.maxWatts.toFixed(1), sortable: true },
        { name: 'Min Watts', selector: row => row.minWatts.toFixed(1), sortable: true },
        { name: 'Count', selector: row => row.count, sortable: true },
        { name: 'Duration (Seconds)', selector: row => row.durationInSeconds, sortable: true },
        { name: 'Wh', selector: row => row.watthours.toFixed(1), sortable: true },
        { name: 'kWh', selector: row => (row.watthours / 1000).toFixed(2), sortable: true }
      ]
    : [
        { name: 'Time', selector: row => row.updateTime, sortable: true },
        { name: 'Switch Status', selector: row => row.switchStatus, sortable: true },
        { name: 'Country', selector: row => row.country, sortable: true },
        { name: 'Town', selector: row => row.town, sortable: true },
        { name: 'Volt', selector: row => row.volt.toFixed(0), sortable: true },
        { name: 'Current', selector: row => (row.current / 1000).toFixed(2), sortable: true },
        { name: 'Watts', selector: row => row.watts.toFixed(1), sortable: true }
      ];

  // Generate data for the chart based on aggregation type
  const chartData = aggregatedData.map(item => ({
    x: item.time,
    y: item.watts // Example of using watts for the chart, can change based on aggregation type
  }));

  // Chart options, changing chart type based on aggregation type
  const chartOptions = {
    chart: {
      id: 'smart-plug-chart'
    },
    xaxis: {
      categories: aggregatedData.map(item => item.time)
    },
    plotOptions: {
      bar: {
        horizontal: false,
      }
    },
    title: {
      text: 'Aggregated Data Chart'
    }
  };

  // Line or bar chart conditionally based on the aggregation type
  const chartType = aggregationType === 'minute' ? 'line' : 'bar';

  // Use the DataTable component for rendering the table
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

      {/* Apex Chart Row - Visible only when Aggregated Data is selected */}
      {dataType === 'aggregated' && (
        <Row className="mb-4">
          <Col>
            <h3>{`Aggregated Data Chart (${aggregationType})`}</h3>
            <ApexCharts
              options={chartOptions}
              series={[{ name: 'Watts', data: chartData.map(item => item.y) }]}
              type={chartType}
              height={350}
            />
          </Col>
        </Row>
      )}

      {/* Unified DataTable for Aggregated or Device Data */}
      <Row>
        <Col>
          <h3>{dataType === 'aggregated' ? `Aggregated Data (${aggregationType})` : 'Device Data'}</h3>
          <DataTable
            columns={columns}
            data={dataType === 'aggregated' ? aggregatedData : deviceData}
            pagination
            highlightOnHover
            responsive
            striped
          />
        </Col>
      </Row>
    </div>
  );
};

export default SmartPlugData;
