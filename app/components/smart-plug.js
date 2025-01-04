'use client'; // Marking this file as a client-side component

import { useState, useEffect } from 'react';
import { Form, Row, Col, Badge, Stack, InputGroup } from 'react-bootstrap'; // Importing Bootstrap components
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
  const [unitType, setUnitType] = useState('wh'); // Default unit is 'wh'

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
  }, [startDate, endDate, dataType, aggregationType, unitType, isClient]);

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

  // Handle unit type toggle switch (switch between Wh/kWh)
  const handleUnitTypeChange = (e) => {
    setUnitType(e.target.checked ? 'kwh' : 'wh');
  };

  // Handle form submission (if needed)
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData(); // Trigger data fetch when form is submitted (optional, if you want a button)
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Define columns for the DataTable based on the data type and unit type
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
        { name: unitType === 'wh' ? 'Wh' : 'kWh', selector: row => unitType === 'wh' ? row.watthours.toFixed(1) : (row.watthours / 1000).toFixed(2), sortable: true }
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

  // Handle rendering the chart with the unit toggle applied
  const renderChart = () => {
    if (!aggregatedData.length) {
      return <div>There are no records to display in the chart section.</div>;
    }

    // Define chart data and options
    const chartData = {
      labels: aggregatedData.map(item => item.time),
      datasets: [
        {
          label: unitType === 'wh' ? 'Wh' : 'kWh',
          data: aggregatedData.map(item => unitType === 'wh' ? item.watthours : item.watthours / 1000),
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
        {/* <Col> */}
            <Form style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
            {/* Start Date */}
            <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
            <InputGroup className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
                <InputGroup.Text style={{ minWidth: '150px' }}>
                <i className="bi bi-calendar">Start Date:</i> {/* Optional: Add an icon */}
                </InputGroup.Text>
                <Form.Control 
                type="date" 
                value={startDate} 
                onChange={handleStartDateChange} 
                placeholder="Start Date" 
                />
            </InputGroup>
            </Col>

            {/* End Date */}
            <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
            <InputGroup className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
                <InputGroup.Text style={{ minWidth: '150px' }}>
                <i className="bi bi-calendar">End Date:</i> {/* Optional: Add an icon */}
                </InputGroup.Text>
                <Form.Control 
                type="date" 
                value={endDate} 
                onChange={handleEndDateChange} 
                placeholder="End Date" 
                />
            </InputGroup>
            </Col>

            {/* Data Type Selection */}
            <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
            <InputGroup className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
                <InputGroup.Text style={{ minWidth: '150px' }}>
                <i className="bi bi-database">Data Type:</i> {/* Optional: Add an icon */}
                </InputGroup.Text>
                <Form.Control as="select" value={dataType} onChange={handleDataTypeChange}>
                <option value="aggregated">Aggregated Data</option>
                <option value="deviceData">Device Data</option>
                </Form.Control>
            </InputGroup>
            </Col>

            {/* Aggregation Type (only visible when 'aggregated' is selected) */}
            <Col xs={12} sm={6} md={4} lg={3} className="mb-3">

            {dataType === 'aggregated' && (
                <InputGroup className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
                <InputGroup.Text style={{ minWidth: '150px' }}>
                    <i className="bi bi-clock">Aggregation Type:</i> {/* Optional: Add an icon */}
                </InputGroup.Text>
                <Form.Control as="select" value={aggregationType} onChange={handleAggregationTypeChange}>
                    <option value="minute">Minute</option>
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                </Form.Control>
                </InputGroup>
            )}
                        </Col>

            </Form>
        {/* </Col> */}
      </Row>

      {/* Unit Type Toggle Switch (Wh / kWh) */}
      <Row className="mb-4">
        <Col >
          <Form.Check
            type="switch"
            id="unitTypeSwitch"
            label={unitType === 'wh' ? 'Click to tisplay in kWh' : 'Click to display in Wh'}
            checked={unitType === 'kwh'}
            onChange={handleUnitTypeChange}
          />
        </Col>
      </Row>
      <Row>
        <Stack direction="horizontal" gap={2}>
            <Badge bg="primary">
                Total kWh/Wh:{aggregatedData.reduce((acc, curr) => acc + (unitType === 'Wh' ? curr.watthours : curr.watthours / 1000), 0).toFixed(2)} {unitType === 'Wh' ? 'Wh' : 'kWh'}
            </Badge>
            <Badge bg="info">
                Avg Power: {(aggregatedData.reduce((acc, curr) => acc + curr.watts, 0))/ aggregatedData.length}W
            </Badge>
            <Badge bg="dark">
                Max Power: Max:{Math.max(...aggregatedData.map(item => item.maxWatts)).toFixed(2)}W
            </Badge>
            <Badge bg="secondary">
                Min Power: {Math.min(...aggregatedData.map(item => item.minWatts)).toFixed(2)}W
            </Badge>
            <Badge bg="success">
                Avg Volt: {(aggregatedData.reduce((acc, curr) => acc + curr.volt, 0))/ aggregatedData.length}V
            </Badge>
            <Badge bg="danger">
                Avg Current: {((aggregatedData.reduce((acc, curr) => acc + curr.current, 0))/ aggregatedData.length)/1000}A
            </Badge>
            <Badge bg="warning" text="dark">
                Max Current: Max :{Math.max(...aggregatedData.map(item => item.current/1000)).toFixed(2)}A
            </Badge>
            <Badge bg="light" text="warning" className="border border-warning">
                Min Current: {Math.min(...aggregatedData.map(item => item.current/1000)).toFixed(2)}A
            </Badge>

            </Stack>
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
