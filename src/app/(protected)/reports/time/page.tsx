"use client";
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

type Ticket = {
  id: number;
  submitDate: string;
  resolveDate: string;
  timeUsed: number; // in days
};

type ChartDataPoint = {
  range: string;
  count: number;
};

const TimeReportPage: React.FC = () => {
  // State for filters
  const [ticketType, setTicketType] = useState<'Incidents' | 'Requirements'>('Incidents');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // State for data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [averageTime, setAverageTime] = useState<number>(0);
  
  // Clear data when ticket type changes
  useEffect(() => {
    setTickets([]);
    setChartData([]);
    setAverageTime(0);
  }, [ticketType]);
  
  // Calculate average time and chart data when tickets change
  useEffect(() => {
    if (tickets.length > 0) {
      // Calculate average time
      const totalTime = tickets.reduce((sum, ticket) => sum + ticket.timeUsed, 0);
      setAverageTime(totalTime / tickets.length);
      
      // Generate chart data
      setChartData(generateChartData());
    } else {
      setAverageTime(0);
      setChartData([]);
    }
  }, [tickets]);
  
  // Fetch tickets from Firestore
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Determine which collection to query based on ticket type
      const collectionName = ticketType === 'Incidents' ? 'Incidents' : 'Requirements';
      
      // Field names for each ticket type
      const reportDateField = ticketType === 'Incidents' ? 'incident_report_date' : 'requirement_submit_date';
      const resolutionDateField = ticketType === 'Incidents' ? 'incident_resolution_date' : 'resolution_date';
      const idField = ticketType === 'Incidents' ? 'incident_id' : 'requirement_id';
      const statusField = ticketType === 'Incidents' ? 'incident_status' : 'requirement_status';
      
      // Create the query reference
      const ticketsRef = collection(db, collectionName);
      let ticketQuery;
      
      // If date filters are applied, use them; otherwise, fetch all resolved tickets
      if (startDate && endDate) {
        // Convert string dates to Timestamp objects for Firestore query
        const startTimestamp = Timestamp.fromDate(new Date(startDate));
        
        // Create date with time at end of day for proper filtering
        const endDateWithTime = new Date(endDate);
        endDateWithTime.setHours(23, 59, 59, 999);
        const endTimestampAdjusted = Timestamp.fromDate(endDateWithTime);
        
        // Query with date range
        ticketQuery = query(
          ticketsRef,
          where(reportDateField, '>=', startTimestamp),
          where(reportDateField, '<=', endTimestampAdjusted),
          where(statusField, '==', 'Resolved')
        );
      } else {
        // Get all resolved tickets if no date filters
        ticketQuery = query(
          ticketsRef,
          where(statusField, '==', 'Resolved')
        );
      }
      
      const querySnapshot = await getDocs(ticketQuery);
      
      // Process the results
      const fetchedTickets: Ticket[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Skip tickets that don't have a resolution date
        if (!data[resolutionDateField]) return;
        
        // Calculate time used in days
        const submitDate = data[reportDateField].toDate();
        const resolveDate = data[resolutionDateField].toDate();
        const timeUsedMs = resolveDate.getTime() - submitDate.getTime();
        const timeUsedDays = Math.ceil(timeUsedMs / (1000 * 60 * 60 * 24)); // Convert to days and round up
        
        fetchedTickets.push({
          id: data[idField],
          submitDate: formatDate(submitDate),
          resolveDate: formatDate(resolveDate),
          timeUsed: timeUsedDays
        });
      });
      
      // Sort by ID
      fetchedTickets.sort((a, b) => a.id - b.id);
      setTickets(fetchedTickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to fetch tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]; 
  };
  
  // Generate chart data with dynamic ranges
  const generateChartData = () => {
    if (tickets.length === 0) return [];
    
    // Find min and max resolution times to determine range
    const minTime = Math.min(...tickets.map(t => t.timeUsed));
    let maxTime = Math.max(...tickets.map(t => t.timeUsed));
    
    // Ensure minimum range size
    if (maxTime - minTime < 5) {
      maxTime = minTime + 5;
    }
    
    // Determine optimal number of buckets (between 4-7 buckets depending on data range)
    const rangeSize = maxTime - minTime;
    let numBuckets = 5; // Default
    
    if (rangeSize <= 10) numBuckets = 4;
    else if (rangeSize > 30) numBuckets = 6;
    else if (rangeSize > 60) numBuckets = 7;
    
    // Calculate bucket size (rounded to make friendly numbers)
    let bucketSize = Math.ceil(rangeSize / numBuckets);
    
    // Round bucket size to a friendly number
    if (bucketSize > 10) {
      bucketSize = Math.ceil(bucketSize / 5) * 5;
    } else if (bucketSize > 3) {
      bucketSize = Math.ceil(bucketSize / 2) * 2;
    }
    
    // Create buckets with calculated size
    const buckets: { [key: string]: number } = {};
    let lowerBound = 0; // Start from 0 regardless of min time for better readability
    
    // Create bucket ranges
    while (lowerBound <= maxTime) {
      const upperBound = lowerBound + bucketSize - 1;
      const bucketKey = `${lowerBound}-${upperBound} days`;
      buckets[bucketKey] = 0;
      lowerBound += bucketSize;
    }
    
    // Add a catch-all bucket if needed
    const lastBucketKey = Object.keys(buckets).pop() || '';
    const lastUpperBound = parseInt(lastBucketKey.split('-')[1]);
    if (lastUpperBound < maxTime) {
      buckets[`${lastUpperBound + 1}+ days`] = 0;
    }
    
    // Count tickets in each bucket
    tickets.forEach(ticket => {
      let placed = false;
      
      for (const bucketKey of Object.keys(buckets)) {
        if (bucketKey.endsWith('+ days')) {
          const lowerBound = parseInt(bucketKey.split('+')[0]);
          if (ticket.timeUsed >= lowerBound) {
            buckets[bucketKey]++;
            placed = true;
            break;
          }
        } else {
          const [lowerStr, upperStr] = bucketKey.split('-');
          const lowerBound = parseInt(lowerStr);
          const upperBound = parseInt(upperStr.split(' ')[0]);
          
          if (ticket.timeUsed >= lowerBound && ticket.timeUsed <= upperBound) {
            buckets[bucketKey]++;
            placed = true;
            break;
          }
        }
      }
      
      // Safety check - place in the highest bucket if not placed yet
      if (!placed) {
        const lastBucketKey = Object.keys(buckets).pop() || '';
        buckets[lastBucketKey]++;
      }
    });
    
    // Convert to array format for the chart
    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count
    }));
  };

  // Get the maximum count for chart scaling
  const getMaxCount = () => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(item => item.count));
  };
  
  // Calculate the bar height percentage based on count
  const getBarHeight = (count: number) => {
    const maxCount = getMaxCount();
    if (maxCount === 0) return 0;
    return (count / maxCount) * 100;
  };
  
  // Generate Y-axis markers based on the max count
  const generateYAxisMarkers = () => {
    const maxCount = getMaxCount();
    if (maxCount === 0) return [];
    
    const step = maxCount <= 5 ? 1 : Math.ceil(maxCount / 5);
    const yAxisValues = [];
    
    for (let i = 0; i <= maxCount; i += step) {
      yAxisValues.push(i);
    }
    
    // Make sure max value is included
    if (yAxisValues[yAxisValues.length - 1] !== maxCount) {
      yAxisValues.push(maxCount);
    }
    
    return yAxisValues;
  };
  
  // Generate grid lines based on the max count
  const generateGridLines = () => {
    const maxCount = getMaxCount();
    if (maxCount === 0) return [];
    
    const step = maxCount <= 5 ? 1 : Math.ceil(maxCount / 5);
    const gridLines = [];
    
    for (let i = step; i < maxCount; i += step) {
      gridLines.push(i);
    }
    
    return gridLines;
  };

  return (
    <div className="text-black p-4">
      <h1 className="text-[2rem] font-bold mb-6">Time Report</h1>
      
      {/* Filters Section */}
      <div className="mb-6 bg-white p-3 rounded-lg shadow">
        {/* Filter inputs in a single row */}
        <div className="flex flex-wrap items-end space-x-4 mb-2">
          {/* Ticket Type Filter */}
          <div>
            <label className="block text-gray-700 font-medium mb-0.5 text-sm">Ticket Type</label>
            <select
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value as 'Incidents' | 'Requirements')}
              className="w-32 border border-gray-300 rounded py-0.5 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Incidents">Incidents</option>
              <option value="Requirements">Requirements</option>
            </select>
          </div>
          
          {/* Start Date Filter */}
          <div>
            <label className="block text-gray-700 font-medium mb-0.5 text-sm">Start Date </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40 border border-gray-300 rounded py-0.5 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          {/* End Date Filter */}
          <div>
            <label className="block text-gray-700 font-medium mb-0.5 text-sm">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40 border border-gray-300 rounded py-0.5 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          {/* Apply Filters Button - integrated into the same row */}
          <div>
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1 px-3 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 h-7"
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>
        </div>
        
        {/* Notes about filters */}
        <div className="text-xs text-gray-500 mt-1">
          {!startDate && !endDate ? 
            "Showing all resolved tickets" : 
            "Filter by date range or leave empty to see all tickets"}
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Results Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          {ticketType} Time Report: {startDate && endDate ? `${startDate} to ${endDate}` : "All Resolved Tickets"}
        </h2>
        
        {/* Tickets Table with very tight columns spacing */}
        <div className="w-auto inline-block align-middle">
          <table className="bg-white border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-1 border-b border-r border-gray-200 text-left">ID</th>
                <th className="py-2 px-1 border-b border-r border-gray-200 text-left">Submit Date</th>
                <th className="py-2 px-1 border-b border-r border-gray-200 text-left">Resolve Date</th>
                <th className="py-2 px-1 border-b border-gray-200 text-left">Time (Days)</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="py-2 px-1 border-b border-r border-gray-200">{ticket.id}</td>
                    <td className="py-2 px-1 border-b border-r border-gray-200">{ticket.submitDate}</td>
                    <td className="py-2 px-1 border-b border-r border-gray-200">{ticket.resolveDate}</td>
                    <td className="py-2 px-1 border-b border-gray-200">{ticket.timeUsed}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 px-1 text-center text-gray-500">
                    {loading ? 'Loading tickets...' : 'No resolved tickets found for the selected criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Average Time */}
        {tickets.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Analysis</h3>
            <p className="text-gray-800">
              <span className="font-medium">Average Resolution Time:</span> {averageTime.toFixed(2)} days
            </p>
            <p className="text-gray-800 mt-1">
              <span className="font-medium">Total Tickets Resolved:</span> {tickets.length}
            </p>
          </div>
        )}
        
        {/* Resolution Time Distribution Chart */}
        {tickets.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Resolution Time Distribution</h3>
            
            {/* Custom chart implementation */}
            <div className="mt-4 h-80 flex items-end justify-around border-b border-l border-gray-300 relative">
              {/* Y-axis label */}
              <div className="absolute -left-10 top-1/2 -rotate-90 text-gray-600 font-medium">
                Number of Tickets
              </div>
              
              {/* Y-axis scale markers - dynamically calculated */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between items-end pr-2">
                {generateYAxisMarkers().map((value, index) => (
                  <div 
                    key={index} 
                    className="flex items-center"
                    style={{ 
                      position: 'absolute',
                      bottom: `${(value / getMaxCount()) * 100}%`,
                      transform: 'translateY(50%)'
                    }}
                  >
                    <span className="text-sm font-medium text-gray-700 mr-1">{value}</span>
                    <div className="w-2 h-px bg-gray-300"></div>
                  </div>
                ))}
              </div>
              
              {/* Bars with precise height percentage */}
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center mx-1 z-10 relative h-full">
                  {/* The bar */}
                  <div
                    className="w-16 bg-blue-500 rounded-t transition-all duration-500 flex items-center justify-center absolute bottom-0"
                    style={{ 
                      height: `${getBarHeight(item.count)}%`
                    }}
                  >
                    <span className="text-white font-medium text-base">{item.count}</span>
                  </div>
                  
                  {/* X-axis label */}
                  <div className="text-gray-700 font-medium text-sm w-20 text-center absolute -bottom-8">
                    {item.range}
                  </div>
                </div>
              ))}
              
              {/* Horizontal grid lines for better readability */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {generateGridLines().map((value) => (
                  <div 
                    key={value} 
                    className="w-full h-px bg-gray-200"
                    style={{ 
                      position: 'absolute',
                      bottom: `${(value / getMaxCount()) * 100}%` 
                    }}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-12 flex justify-center"> {/* Increased top margin to account for larger X-axis labels */}
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span className="text-gray-700 font-medium">{ticketType} Resolved</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeReportPage;