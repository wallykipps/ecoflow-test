"use client"; // Marking this file as a client-side component

import React, { useState, useEffect } from 'react';
import { Row, Col, Form, InputGroup, Card, CardGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import DataTable from 'react-data-table-component'; // Import react-data-table-component
import Chart from 'react-apexcharts'; // Import ApexCharts
import moment from 'moment'; // Import moment.js for date formatting

const SmartPlugData = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [deviceData, setDeviceData] = useState([]);
  const [aggregatedData, setAggregatedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataType, setDataType] = useState('aggregated'); // Default to aggregated data
  const [aggregationType, setAggregationType] = useState('hour');
  const [chartData, setChartData] = useState([]);
  const [chartOptions, setChartOptions] = useState({
    chart: {
      id: 'basic-chart',
      zoom: { enabled: false },
    },
    xaxis: { categories: [] },
    yaxis: { title: { text: 'Value' }, labels: { formatter: (val) => val.toFixed(2) } },
    title: { text: 'Aggregated Data' },
    dataLabels: { enabled: false },
    tooltip: { enabled: true },
    interactions: { enabled: true },
  });

  const [unitType, setUnitType] = useState('Wh');
  const [deviceColumnsVisibility, setDeviceColumnsVisibility] = useState({
    time: true,
    country: true,
    town: true,
    current: true,
    switchStatus: true,
    volt: true,
    watts: true,
  });

  const [aggregatedColumnsVisibility, setAggregatedColumnsVisibility] = useState({
    time: true,
    avgWatts: true,
    maxWatts: true,
    minWatts: true,
    avgVoltage: true,
    avgCurrent: true,
    count: true,
    durationInSeconds: true,
    wh: true,
    kWh: true,
  });

  const fetchData = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(null);

    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    try {
      let url = `/api/smart-plug?startDate=${formattedStartDate}&endDate=${formattedEndDate}&dataType=${dataType}`;

      if (dataType === 'aggregated') {
        url += `&aggregationType=${aggregationType}`;
      }

      const response = await axios.get(url);

      if (dataType === 'deviceData') {
        setDeviceData(response.data);
        setAggregatedData([]);
        setChartData([]);
      } else {
        setAggregatedData(response.data);
        setDeviceData([]);
        updateChartData(response.data);
      }
    } catch (err) {
      setError('Error fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, dataType, aggregationType]);

  useEffect(() => {
    if (aggregatedData.length > 0) {
      updateChartData(aggregatedData);
    }
  }, [unitType, aggregationType, aggregatedData]);

  const updateChartData = (data) => {
    const categories = data.map((item) => item.time);
    let seriesData = data.map((item) => unitType === 'Wh' ? item.watthours : item.watthours / 1000);

    if (aggregationType === 'minute') {
      setChartOptions({
        ...chartOptions,
        chart: { type: 'line' },
        xaxis: { categories },
        yaxis: { title: { text: `${unitType}` }, labels: { formatter: (val) => val.toFixed(2) } },
        title: { text: `${unitType} Aggregation (Per Minute)` },
      });
    } else {
      setChartOptions({
        ...chartOptions,
        chart: { type: 'bar' },
        xaxis: { categories },
        yaxis: { title: { text: `${unitType}` }, labels: { formatter: (val) => val.toFixed(2) } },
        title: { text: `${unitType} Aggregation` },
      });
    }

    setChartData([
      {
        name: unitType,
        data: seriesData,
      },
    ]);
  };

  const formatDate = (date, aggregationType) => {
    switch (aggregationType) {
      case 'minute':
        return moment(date).format('YY-M-D HH:mm');
      case 'hour':
        return moment(date).format('YY-M-D HH');
      case 'day':
        return moment(date).format('YY-M-D');
      case 'month':
        return moment(date).format('YY-MM');
      case 'year':
        return moment(date).format('YYYY');
      default:
        return moment(date).format('YY-M-D');
    }
  };

  const aggregatedColumns = [
    { name: '#', selector: row => row.index, sortable: true, visible: aggregatedColumnsVisibility.time },
    { name: 'Time', selector: row => formatDate(row.time, aggregationType), sortable: true, visible: aggregatedColumnsVisibility.time },
    { name: 'Avg Voltage', selector: row => row.volt ? row.volt.toFixed(2) : 0, sortable: true, visible: aggregatedColumnsVisibility.avgVoltage },
    { name: 'Avg Current', selector: row => row.current ? row.current.toFixed(2) : 0, sortable: true, visible: aggregatedColumnsVisibility.avgCurrent },
    { name: 'Avg Watts', selector: row => row.watts ? row.watts.toFixed(2) : 0, sortable: true, visible: aggregatedColumnsVisibility.avgWatts },
    { name: 'Max Watts', selector: row => row.maxWatts ? row.maxWatts.toFixed(2) : 0, sortable: true, visible: aggregatedColumnsVisibility.maxWatts },
    { name: 'Min Watts', selector: row => row.minWatts ? row.minWatts.toFixed(2) : 0, sortable: true, visible: aggregatedColumnsVisibility.minWatts },
    { name: 'Count', selector: row => row.count, sortable: true, visible: aggregatedColumnsVisibility.count },
    { name: 'Duration (Seconds)', selector: row => row.durationInSeconds, sortable: true, visible: aggregatedColumnsVisibility.durationInSeconds },
    { name: 'Wh', selector: row => row.watthours ? row.watthours.toFixed(2) : 0, sortable: true, visible: aggregatedColumnsVisibility.wh },
    { name: 'kWh', selector: row => row.watthours ? (row.watthours / 1000).toFixed(2) : 0, sortable: true, visible: aggregatedColumnsVisibility.kWh }
  ];

  const rawDataColumns = [
    { name: 'Time', selector: row => formatDate(row.updateTime, aggregationType), sortable: true, visible: deviceColumnsVisibility.time },
    { name: 'Country', selector: row => row.country, sortable: true, visible: deviceColumnsVisibility.country },
    { name: 'Town', selector: row => row.town, sortable: true, visible: deviceColumnsVisibility.town },
    { name: 'Current', selector: row => row.current ? row.current.toFixed(2) : 0, sortable: true, visible: deviceColumnsVisibility.current },
    { name: 'Status', selector: row => row.switchStatus, sortable: true, visible: deviceColumnsVisibility.switchStatus },
    { name: 'Voltage', selector: row => row.volt ? row.volt.toFixed(2) : 0, sortable: true, visible: deviceColumnsVisibility.volt },
    { name: 'Watts', selector: row => row.watts.toFixed(2), sortable: true, visible: deviceColumnsVisibility.watts }
  ];

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 576) {
        setDeviceColumnsVisibility({
          time: true,
          country: false,
          town: false,
          current: true,
          switchStatus: false,
          volt: true,
          watts: true,
        });
        setAggregatedColumnsVisibility({
          time: true,
          avgWatts: false,
          maxWatts: false,
          minWatts: false,
          avgVoltage: false,
          avgCurrent: false,
          count: false,
          durationInSeconds: false,
          wh: true,
          kWh: true,
        });
      } else if (width < 768) {
        setDeviceColumnsVisibility({
          time: true,
          country: false,
          town: false,
          current: true,
          switchStatus: false,
          volt: true,
          watts: true,
        });
        setAggregatedColumnsVisibility({
          time: true,
          avgWatts: false,
          maxWatts: false,
          minWatts: false,
          avgVoltage: false,
          avgCurrent: true,
          count: false,
          durationInSeconds: false,
          wh: true,
          kWh: true,
        });
      } else if (width < 992) {
        setDeviceColumnsVisibility({
          time: true,
          country: true,
          town: true,
          current: true,
          switchStatus: true,
          volt: true,
          watts: true,
        });
        setAggregatedColumnsVisibility({
          time: true,
          avgWatts: true,
          maxWatts: false,
          minWatts: false,
          avgVoltage: true,
          avgCurrent: true,
          count: false,
          durationInSeconds: false,
          wh: true,
          kWh: true,
        });
      } else {
        setDeviceColumnsVisibility({
          time: true,
          country: true,
          town: true,
          current: true,
          switchStatus: true,
          volt: true,
          watts: true,
        });
        setAggregatedColumnsVisibility({
          time: true,
          avgWatts: true,
          maxWatts: true,
          minWatts: true,
          avgVoltage: true,
          avgCurrent: true,
          count: true,
          durationInSeconds: true,
          wh: true,
          kWh: true,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div>
      <Row>
        <Form style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
          <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
            <InputGroup className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
              <InputGroup.Text style={{ minWidth: '120px' }}>Start Date:</InputGroup.Text>
              <Form.Control
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
            </InputGroup>
          </Col>

          <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
            <InputGroup className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
              <InputGroup.Text style={{ minWidth: '120px' }}>End Date:</InputGroup.Text>
              <Form.Control
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
            </InputGroup>
          </Col>

          <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
            <InputGroup className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
              <InputGroup.Text style={{ minWidth: '120px' }}>Data Type:</InputGroup.Text>
              <Form.Control
                as="select"
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
              >
                <option value="aggregated">Aggregated Data</option>
                <option value="deviceData">Device Data</option>
              </Form.Control>
            </InputGroup>
          </Col>

          {dataType === 'aggregated' && (
            <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
              <InputGroup className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
                <InputGroup.Text style={{ minWidth: '150px' }}>Aggregation Type:</InputGroup.Text>
                <Form.Control
                  as="select"
                  value={aggregationType}
                  onChange={(e) => setAggregationType(e.target.value)}
                  style={{ flexGrow: 1 }}
                >
                  <option value="minute">Per Minute</option>
                  <option value="hour">Per Hour</option>
                  <option value="day">Per Day</option>
                  <option value="month">Per Month</option>
                  <option value="year">Per Year</option>
                </Form.Control>
              </InputGroup>
            </Col>
          )}
        </Form>
      </Row>

      {/* Loading Indicator */}
      {loading && <p>Loading...</p>}

      {/* Error Message */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Data Table and Chart */}
      {dataType === 'deviceData' && (
        <DataTable
          title="Device Data"
          columns={rawDataColumns.filter(column => column.visible)}
          data={deviceData}
          pagination
        />
      )}

      {dataType === 'aggregated' && (
        <>
          <DataTable
            title="Aggregated Data"
            columns={aggregatedColumns.filter(column => column.visible)}
            data={aggregatedData}
            pagination
          />
          <CardGroup>
            <Card>
              <Card.Body>
                <Chart
                  options={chartOptions}
                  series={chartData}
                  type={chartOptions.chart.type}
                  height="350"
                />
              </Card.Body>
            </Card>
          </CardGroup>
        </>
      )}
    </div>
  );
};

export default SmartPlugData;
