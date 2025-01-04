'use client'; // Marking this file as a client-side component

import { useState, useEffect } from 'react';
import { Form, Row, Col } from 'react-bootstrap'; // Importing Bootstrap components
import DataTable from 'react-data-table-component'; // Importing react-data-table-component
import { Line, Bar } from 'react-chartjs-2'; // Importing Chart.js components
import 'bootstrap/dist/css/bootstrap.min.css';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

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

  // Client-side flag to check if we're on the client
  const [isClient, setIsClient] = useState(false);

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

  // Set isClient to true after the component has mounted, indicating we are on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch data whenever startDate, endDate, dataType, or aggregationType changes
  useEffect(() => {
    if (isClient) { // Only fetch data if on the client
      fetchData();
    }
  }, [startDate, endDate, dataType, aggregationType, isClient]);

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

  // Define columns for the DataTable based on the data type
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

  // Handle rendering the chart
  const renderChart = () => {
    if (!aggregatedData.length) {
      return <div>There are no records to display in the chart section.</div>;
    }

    // Define chart data and options
    const chartData = {
      labels: aggregatedData.map(item => item.time),
      datasets: [
        {
          label: 'Watts',
          data: aggregatedData.map(item => item.watts),
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.2)',
          borderWidth: 1,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Aggregated Data Chart (${aggregationType})`,
        },
      },
    };

    return aggregationType === 'minute' ? (
      <Line data={chartData} options={chartOptions} />
    ) : (
      <Bar data={chartData} options={chartOptions} />
    );
  };

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

      {/* Chart Section */}
      {dataType === 'aggregated' && (
        <Row className="mb-4">
          <Col>
            {renderChart()}
          </Col>
        </Row>
      )}

      {/* DataTable Section */}
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
