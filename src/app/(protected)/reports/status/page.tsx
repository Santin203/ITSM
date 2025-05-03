"use client";
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

type Ticket = {
  id: number;
  status: string;
  submitDate: string;
};

type StatusCount = {
  status: string;
  count: number;
  percentage: number;
  color: string;
};

const StatusReportPage: React.FC = () => {
  // State for filters
  const [ticketType, setTicketType] = useState<'Incidents' | 'Requirements'>('Incidents');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // State for data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  
  // Color palette for different statuses
  const statusColors: { [key: string]: string } = {
    'Sent': '#4F46E5', // Indigo
    'Assigned': '#3B82F6', // Blue
    'In Progress': '#10B981', // Emerald
    'Escalated': '#F59E0B', // Amber
    'Resolved': '#84CC16', // Lime
    'Closed': '#6B7280', // Gray
    // Fallback colors for any other statuses
    'Other': '#9333EA', // Purple
  };
  
  // Clear data when ticket type changes
  useEffect(() => {
    setTickets([]);
    setStatusCounts([]);
    setTotalTickets(0);
  }, [ticketType]);
  
  // Calculate status counts and percentages when tickets change
  useEffect(() => {
    if (tickets.length > 0) {
      const counts: { [key: string]: number } = {};
      
      // Count occurrences of each status
      tickets.forEach(ticket => {
        if (counts[ticket.status]) {
          counts[ticket.status]++;
        } else {
          counts[ticket.status] = 1;
        }
      });
      
      // Convert to array with percentages and colors
      const statusCountsArray: StatusCount[] = Object.entries(counts).map(([status, count]) => {
        return {
          status,
          count,
          percentage: Math.round((count / tickets.length) * 100),
          color: statusColors[status] || statusColors['Other']
        };
      });
      
      // Sort by count (descending)
      statusCountsArray.sort((a, b) => b.count - a.count);
      
      setStatusCounts(statusCountsArray);
      setTotalTickets(tickets.length);
    } else {
      setStatusCounts([]);
      setTotalTickets(0);
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
      const idField = ticketType === 'Incidents' ? 'incident_id' : 'requirement_id';
      const statusField = ticketType === 'Incidents' ? 'incident_status' : 'requirement_status';
      
      // Create the query reference
      const ticketsRef = collection(db, collectionName);
      let ticketQuery;
      
      // If date filters are applied, use them; otherwise, fetch all tickets
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
          where(reportDateField, '<=', endTimestampAdjusted)
        );
      } else {
        // Get all tickets if no date filters
        ticketQuery = query(ticketsRef);
      }
      
      const querySnapshot = await getDocs(ticketQuery);
      
      // Process the results
      const fetchedTickets: Ticket[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Get submit date and format it
        const submitDate = data[reportDateField]?.toDate();
        
        fetchedTickets.push({
          id: data[idField],
          status: data[statusField] || 'Unknown',
          submitDate: submitDate ? formatDate(submitDate) : 'Unknown'
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

  // Calculate the pie chart segments
  const calculatePieSegments = () => {
    let currentAngle = 0;
    
    // For a single status, we need to ensure we draw a full circle
    if (statusCounts.length === 1) {
      return [{
        ...statusCounts[0],
        startAngle: 0,
        angle: 360
      }];
    }
    
    return statusCounts.map((status, index) => {
      const startAngle = currentAngle;
      const angle = (status.percentage / 100) * 360;
      currentAngle += angle;
      
      return {
        ...status,
        startAngle,
        angle
      };
    });
  };
  
  // Draw a pie chart segment
  const drawPieSegment = (
    status: string,
    color: string,
    startAngle: number,
    angle: number,
    radius: number
  ) => {
    // For a complete circle (360 degrees), we need special handling
    if (angle === 360) {
      return (
        <circle
          key={status}
          cx="100"
          cy="100"
          r={radius}
          fill={color}
          stroke="#fff"
          strokeWidth="1"
          data-status={status}
        />
      );
    }
    
    // Regular segment calculation for non-complete circles
    const startRad = (startAngle - 90) * Math.PI / 180; // -90 to start at top
    const endRad = (startAngle + angle - 90) * Math.PI / 180;
    
    // Center point of the pie
    const cx = 100;
    const cy = 100;
    
    // Calculate start and end points
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    
    // Determine if the arc should be drawn the long way around
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    // Create the SVG path
    const path = [
      `M ${cx},${cy}`,  // Move to center
      `L ${x1},${y1}`,  // Line to start point
      `A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2}`, // Arc
      'Z'               // Close path
    ].join(' ');
    
    return (
      <path
        key={status}
        d={path}
        fill={color}
        stroke="#fff"
        strokeWidth="1"
        data-status={status}
      />
    );
  };

  return (
    <div className="text-black p-4">
      <h1 className="text-[2rem] font-bold mb-6">Status Report</h1>
      
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
            <label className="block text-gray-700 font-medium mb-0.5 text-sm">Start Date <span className="text-xs text-gray-500">(Optional)</span></label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40 border border-gray-300 rounded py-0.5 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          {/* End Date Filter */}
          <div>
            <label className="block text-gray-700 font-medium mb-0.5 text-sm">End Date <span className="text-xs text-gray-500">(Optional)</span></label>
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
            "Showing all tickets" : 
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
          {ticketType} Status Report: {startDate && endDate ? `${startDate} to ${endDate}` : "All Tickets"}
        </h2>
        
        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Loading tickets...
          </div>
        ) : tickets.length > 0 ? (
          <div className="flex flex-col md:flex-row">
            {/* Pie Chart */}
            <div className="w-full md:w-1/2 flex justify-center items-center p-4">
              <div className="relative w-56 h-56">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {calculatePieSegments().map(segment => 
                    drawPieSegment(
                      segment.status,
                      segment.color,
                      segment.startAngle,
                      segment.angle,
                      80 // radius
                    )
                  )}
                  {/* Center circle for better appearance */}
                  <circle cx="100" cy="100" r="40" fill="white" />
                  {/* Total count in center */}
                  <text x="100" y="95" textAnchor="middle" className="font-bold text-2xl fill-gray-800">
                    {totalTickets}
                  </text>
                  <text x="100" y="115" textAnchor="middle" className="text-sm fill-gray-600">
                    Total Tickets
                  </text>
                </svg>
              </div>
            </div>
            
            {/* Status Legend and Details */}
            <div className="w-full md:w-1/2 p-4">
              <h3 className="text-lg font-medium mb-4">Status Distribution</h3>
              
              <div className="space-y-2">
                {statusCounts.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-2" 
                        style={{ backgroundColor: status.color }}
                      ></div>
                      <span className="text-gray-800 font-medium">{status.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{status.count}</span>
                      <span className="text-gray-500 ml-2">({status.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Summary information */}
              <div className="mt-6 p-3 bg-gray-50 rounded border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">Summary</h4>
                <p className="text-sm text-gray-600">
                  This report shows the distribution of {ticketType.toLowerCase()} by status.
                  {statusCounts.length > 0 && (
                    <>
                      <br />
                      The most common status is <span className="font-medium">{statusCounts[0].status}</span> with <span className="font-medium">{statusCounts[0].percentage}%</span> of all tickets.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No tickets found for the selected criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusReportPage;