"use client"; // Marking this file as a client-side component
import { useState, useEffect } from 'react';
import { Form, Row, Col, Badge, Stack, InputGroup, Spinner, Button } from 'react-bootstrap'; // Importing Spinner and Button
import DataTable from 'react-data-table-component'; // Importing react-data-table-component
import { Line, Bar } from 'react-chartjs-2'; // Importing Chart.js components
import 'bootstrap/dist/css/bootstrap.min.css';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom'; // Import chartjs-plugin-zoom

// Register Chart.js components and the zoom plugin
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, zoomPlugin);

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

  const [isClient, setIsClient] = useState(false);

  // Fetch data function
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) { // Only fetch data if on the client
      fetchData();
    }
  }, [startDate, endDate, dataType, aggregationType, unitType, isClient]);

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const handleDataTypeChange = (e) => {
    setDataType(e.target.value);
  };

  const handleAggregationTypeChange = (e) => {
    setAggregationType(e.target.value);
  };

  const handleUnitTypeChange = (e) => {
    setUnitType(e.target.checked ? 'kwh' : 'wh');
  };

  if (loading) return <div><Spinner animation="border" /> Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Chart.js chart data
  const renderChart = () => {
    if (!aggregatedData.length) {
      return <div>There are no records to display in the chart section.</div>;
    }

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
      // Zoom and Pan settings
      zoom: {
        enabled: true,
        mode: 'xy', // Allow zoom in both x and y axes
        speed: 0.1, // Adjust zoom speed
      },
      pan: {
        enabled: true,
        mode: 'xy', // Allow pan in both x and y axes
        speed: 10, // Adjust pan speed
      },
    };

    return aggregationType === 'minute' ? (
      <Line data={chartData} options={chartOptions} />
    ) : (
      <Bar data={chartData} options={chartOptions} />
    );
  };

  // Function to download chart data as CSV
  const downloadDataAsCSV = () => {
    const data = aggregatedData.map(item => ({
      time: item.time,
      watts: item.watts.toFixed(1),
      wh: unitType === 'wh' ? item.watthours.toFixed(2) : (item.watthours / 1000).toFixed(2),
    }));

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + 'Time,Watts,Wh/KWh\n' 
      + data.map(e => `${e.time},${e.watts},${e.wh}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'aggregated_data.csv');
    link.click();
  };

  return (
    <div>
      <h3>Smart Plug Data</h3>

      {/* Form for date filters */}
      <Row className="mb-4">
        <Form style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
          {/* Start Date */}
          <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
            <InputGroup className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
              <InputGroup.Text style={{ minWidth: '150px' }}>
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
          <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
            <InputGroup className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
              <InputGroup.Text style={{ minWidth: '150px' }}>
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
          <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
            <InputGroup className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
              <InputGroup.Text style={{ minWidth: '150px' }}>
                <i className="bi bi-database">Data Type:</i>
              </InputGroup.Text>
              <Form.Control as="select" value={dataType} onChange={handleDataTypeChange}>
                <option value="aggregated">Aggregated Data</option>
                <option value="deviceData">Device Data</option>
              </Form.Control>
            </InputGroup>
          </Col>

          {/* Aggregation Type */}
          <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
            {dataType === 'aggregated' && (
              <InputGroup className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
                <InputGroup.Text style={{ minWidth: '150px' }}>
                  <i className="bi bi-clock">Aggregation Type:</i>
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
      </Row>

      {/* Unit Type Switch */}
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

      {/* Download Button */}
      <Row className="mb-4">
        <Col>
          <Button variant="primary" onClick={downloadDataAsCSV}>Download Data as CSV</Button>
        </Col>
      </Row>

      {/* Chart Section */}
      <Row>
        <Col>
        {renderChart()}
        </Col>
      </Row>

      {/* Data Table Section */}
      <Row>
        <Col>
          <h3>{dataType === 'aggregated' ? `Aggregated Data (${aggregationType})` : 'Device Data'}</h3>
          <DataTable
            columns={[
              { name: 'Time', selector: row => row.time, sortable: true },
              { name: 'Watts', selector: row => row.watts.toFixed(1), sortable: true },
              { name: unitType === 'wh' ? 'Wh' : 'kWh', selector: row => unitType === 'wh' ? row.watthours.toFixed(1) : (row.watthours / 1000).toFixed(2), sortable: true },
            ]}
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
