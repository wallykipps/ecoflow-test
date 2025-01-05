"use client"; // Marking this file as a client-side component

import { useState, useEffect } from 'react';
import { Form, Row, Col, Badge, InputGroup, Spinner } from 'react-bootstrap'; // Importing Spinner
import DataTable from 'react-data-table-component'; // Importing react-data-table-component
import { Line, Bar } from 'react-chartjs-2'; // Importing Chart.js components
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Import the CSS globally
import '../styles/globals.css'; // Your existing global styles
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useMediaQuery } from 'react-responsive'; // Importing react-responsive

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

  // Media Queries for responsive column hiding
//   const isXSmall = useMediaQuery({ query: '(max-width: 576px)' });
  const isSmall = useMediaQuery({ query: '(max-width: 768px)' });
  const isMedium = useMediaQuery({ query: '(max-width: 992px)' });
//   const isLarge = useMediaQuery({ query: '(min-width: 1200px)' });

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

  if (loading) return <div><Spinner animation="border" /> Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Define columns for the DataTable based on the data type and unit type
  const columns = dataType === 'aggregated'
    ? [
        { name: 'Time', selector: row => row.time, sortable: true},
        { name: 'Voltage', selector: row => row.volt ? row.volt.toFixed(0) : 0, sortable: true},
        { name: 'Current', selector: row => (row.current ? (row.current / 1000).toFixed(2) : 0), sortable: true},
        { name: 'Average Watts', selector: row => row.watts ? row.watts.toFixed(1) : 0, sortable: true, omit: isSmall },
        { name: 'Max Watts', selector: row => row.maxWatts ? row.maxWatts.toFixed(1) : 0, sortable: true, omit: isMedium },
        { name: 'Min Watts', selector: row => row.minWatts ? row.minWatts.toFixed(1) : 0, sortable: true, omit: isMedium },
        { name: 'Count', selector: row => row.count || 0, sortable: true, omit: isMedium },
        { name: 'Duration (Seconds)', selector: row => row.durationInSeconds || 0, sortable: true, omit: isMedium},
        { name: unitType === 'wh' ? 'Wh' : 'kWh', selector: row => unitType === 'wh' ? (row.watthours ? row.watthours.toFixed(1) : 0) : (row.watthours ? (row.watthours / 1000).toFixed(2) : 0), sortable: true}
      ]
    : [
        { name: 'Time', selector: row => row.updateTime, sortable: true },
        { name: 'Switch Status', selector: row => row.switchStatus || 0, sortable: true, omit: isMedium},
        { name: 'Country', selector: row => row.country || 0, sortable: true,omit: isSmall},
        { name: 'Town', selector: row => row.town || 0, sortable: true,omit: isSmall },
        { name: 'Volt', selector: row => row.volt ? row.volt.toFixed(0) : 0, sortable: true },
        { name: 'Current', selector: row => (row.current ? (row.current / 1000).toFixed(2) : 0), sortable: true },
        { name: 'Watts', selector: row => row.watts ? row.watts.toFixed(1) : 0, sortable: true }
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
      maintainAspectRatio: false, // Allows flexible height
      plugins: {
        title: {
          display: true,
          text: `Aggregated Data Chart (${aggregationType})`,
        },
      },
    };

    return (
      <div style={{ width: '100%', height: '400px' }}> {/* Adjust height as necessary */}
        {aggregationType === 'minute' ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>
    );
  };

  return (
    <div>
      <h2>Smart Plug Data</h2>

      {/* Row for the date filters form */}
      <Row className="mb-4 d-flex justify-content-between">
        <Form style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
          {/* Start Date */}
          <Col xs={12} sm={6} md={4} lg={3}>
            <InputGroup size="sm" className="mb-1" style={{ display: 'flex', alignItems: 'center' }}>
              <InputGroup.Text style={{ width: '100px' }}>
                <i className="bi bi-calendar">Start Date:</i>
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
          <Col xs={12} sm={6} md={4} lg={3}>
            <InputGroup size="sm" className="mb-1" style={{ display: 'flex', alignItems: 'center' }}>
              <InputGroup.Text style={{ width: '100px' }}>
                <i className="bi bi-calendar">End Date:</i>
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
          <Col xs={12} sm={6} md={4} lg={3}>
            <InputGroup size="sm" className="mb-1" style={{ display: 'flex', alignItems: 'center' }}>
              <InputGroup.Text style={{ width: '100px' }}>
                <i className="bi bi-database">Data Type:</i>
              </InputGroup.Text>
              <Form.Control as="select" value={dataType} onChange={handleDataTypeChange}>
                <option value="aggregated">Aggregated Data</option>
                <option value="deviceData">Device Data</option>
              </Form.Control>
              <InputGroup.Text>
                <i className="bi bi-chevron-down"></i> {/* Dropdown icon */}
              </InputGroup.Text>
            </InputGroup>
          </Col>

          {/* Aggregation Type (only visible when 'aggregated' is selected) */}
          <Col xs={12} sm={6} md={4} lg={3}>
            {dataType === 'aggregated' && (
              <InputGroup size="sm" className="mb-1" style={{ display: 'flex', alignItems: 'center' }}>
                <InputGroup.Text style={{ width: '100px' }}>
                  <i className="bi bi-clock">Period:</i>
                </InputGroup.Text>
                <Form.Control as="select" value={aggregationType} onChange={handleAggregationTypeChange}>
                  <option value="minute">Minute</option>
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </Form.Control>
                <InputGroup.Text>
                  <i className="bi bi-chevron-down"></i> {/* Dropdown icon */}
                </InputGroup.Text>
              </InputGroup>
            )}
          </Col>
        </Form>
      </Row>

      {/* Unit Type Toggle Switch (Wh / kWh) */}
      <Row className="mb-4">
        <Col>
          <Form.Check
            type="switch"
            id="unitTypeSwitch"
            label={unitType === 'wh' ? 'Click to display in kWh' : 'Click to display in Wh'}
            checked={unitType === 'kwh'}
            onChange={handleUnitTypeChange}
          />
        </Col>
      </Row>

      {/* Badges Section */}
      {loading ? (
        <div><Spinner animation="border" /> Loading badges...</div>
      ) : (
        <Row className="mb-4 d-flex align-items-center">
        <Col xs={12} sm={6} md={6} lg={3} xl={3} className="mb-2">
            <Badge bg="primary" className="w-100">
            Total kWh/Wh: {aggregatedData.reduce((acc, curr) => acc + (unitType === 'Wh' ? curr.watthours : curr.watthours / 1000), 0).toFixed(2)} {unitType === 'Wh' ? 'Wh' : 'kWh'}
            </Badge>
        </Col>
        <Col xs={12} sm={6} md={6} lg={3} xl={3} className="mb-2">
            <Badge bg="info" className="w-100">
            Avg Power: {((aggregatedData.reduce((acc, curr) => acc + curr.watts, 0)) / aggregatedData.length).toFixed(0)}W
            </Badge>
        </Col>
        <Col xs={12} sm={6} md={6} lg={3} xl={3} className="mb-2">
            <Badge bg="dark" className="w-100">
            Max Power: Max: {Math.max(...aggregatedData.map(item => item.maxWatts)).toFixed(0)}W
            </Badge>
        </Col>
        <Col xs={12} sm={6} md={6} lg={3} xl={3} className="mb-2">
            <Badge bg="secondary" className="w-100">
            Min Power: {Math.min(...aggregatedData.map(item => item.minWatts)).toFixed(0)}W
            </Badge>
        </Col>
        <Col xs={12} sm={6} md={6} lg={3} xl={3} className="mb-2">
            <Badge bg="success" className="w-100">
            Avg Volt: {((aggregatedData.reduce((acc, curr) => acc + curr.volt, 0)) / aggregatedData.length).toFixed(0)}V
            </Badge>
        </Col>
        <Col xs={12} sm={6} md={6} lg={3} xl={3} className="mb-2">
            <Badge bg="danger" className="w-100">
            Avg Current: {(((aggregatedData.reduce((acc, curr) => acc + curr.current, 0)) / aggregatedData.length) / 1000).toFixed(2)}A
            </Badge>
        </Col>
        <Col xs={12} sm={6} md={6} lg={3} xl={3} className="mb-2">
            <Badge bg="warning" text="dark" className="w-100">
            Max Current: Max: {Math.max(...aggregatedData.map(item => item.current / 1000)).toFixed(2)}A
            </Badge>
        </Col>
        <Col xs={12} sm={6} md={6} lg={3} xl={3} className="mb-2">
            <Badge bg="light" text="warning" className="w-100 border border-warning">
            Min Current: {Math.min(...aggregatedData.map(item => item.current / 1000)).toFixed(2)}A
            </Badge>
        </Col>
        </Row>
      )}

      {/* Chart Section */}
      {loading ? (
        <div><Spinner animation="border" /> Loading chart...</div>
      ) : (
        dataType === 'aggregated' && (
          <Row className="mb-4 d-flex align-items-center">
            <Col xs={12}>
              <div style={{ flexGrow: 1 }}>
                {renderChart()}
              </div>
            </Col>
          </Row>
        )
      )}

      {/* DataTable Section */}
      {loading ? (
        <div><Spinner animation="border" /> Loading table...</div>
      ) : (
        <DataTable
          columns={columns}
          data={dataType === 'aggregated' ? aggregatedData : deviceData}
          pagination
          fixedHeader
          responsive
        />
      )}
    </div>
  );
};

export default SmartPlugData;
