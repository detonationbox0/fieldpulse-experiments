import { useState, useRef } from 'react'

// Import Tabulator
import { ReactTabulator } from 'react-tabulator'

// Import the CSS
import 'react-tabulator/css/tabulator_bootstrap3.css'

import './App.css'

function App() {

    let tableRef = useRef(null)

    const [startDate, setStartDate] = useState('2024-07-01')
    const [endDate, setEndDate] = useState('2024-10-01')
    const [tableData, setTableData] = useState([])
    const [loading, setLoading] = useState(false)

    const APIKEY = import.meta.env.VITE_APIKEY

    const handleClick = async () => {

        setLoading(true);

        const unixStartDate = new Date(startDate).getTime() / 1000;
        const unixEndDate = new Date(endDate).getTime() / 1000;

        console.log("CREATED FROM:", unixStartDate)
        console.log("CREATED TO:  ", unixEndDate)

        const statuses = await retrieveStatuses();

        console.log("Statuses....", statuses)

        const baseUrl = 'api/jobs';
        const params = new URLSearchParams({
            sort_by: 'created_at',
            // status_id: statuses.join(','),
            page: 1,
            'filter[0][action]': 'where',
            'filter[0][attribute]': 'start_time',
            'filter[0][operator]': '>',
            'filter[0][value]': unixStartDate,
            'filter[1][action]': 'and', // Updated index for the second filter
            'filter[1][attribute]': 'end_time',
            'filter[1][operator]': '<',
            'filter[1][value]': unixEndDate,
            'filter[2][action]': 'and', // Updated index for the second filter
            'filter[2][attribute]': 'status_id',
            'filter[2][operator]': 'in',
            'filter[2][value]': statuses.join(','),
            'filter[2][class]': 'int_array',
            'rel[customer]': '',
            'rel[invoices]': '',
            'rel[entityLocation]': '',
        });

        fetchData(baseUrl, params, 1, [])
    }

    const fetchData = (baseUrl, params, page, accumulatedData) => {
        params.set('page', page);
        const url = `${baseUrl}?${params.toString()}`;
        console.log(url)

        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': APIKEY,
            }
        })
            .then(response => response.json())
            .then(data => {
                const newTableData = accumulatedData.concat(data.response);
                if (newTableData.length < data.total_count) {
                    fetchData(baseUrl, params, page + 1, newTableData);
                } else {
                    buildTable(newTableData);
                }
            })
    }

    const retrieveStatuses = () => {
        return new Promise((resolve, reject) => {
            fetch('api/jobs/status-workflow-statuses', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': APIKEY
                }
            }).then(response => response.json())
                .then(data => {
                    // Return only the ids of the completed statuses...
                    resolve(data.response
                        .filter(status => status.type === 'completed')
                        .map(status => status.id))

                })
        })
    }

    const buildTable = (data) => {
        // Builds the table data
        console.log(data)
        setTableData(data.map((job) => {
            return {
                id: job.id,
                completed_at: job.completed_at,
                job_type: job.job_type,
                notes: job.notes,
                customer_first_name: job.customer.first_name,
                customer_last_name: job.customer.last_name,
                address_1: job.entity_location ? job.entity_location.address_1 : '',
                address_2: job.entity_location ? job.entity_location.address_2 : '',
                address_3: job.entity_location ? job.entity_location.address_3 : '',
                address_4: job.entity_location ? job.entity_location.address_4 : '',
                address_5: job.entity_location ? job.entity_location.address_5 : '',
                city: job.entity_location ? job.entity_location.city : '',
                state: job.entity_location ? job.entity_location.state : '',
                zip_code: job.entity_location ? job.entity_location.zip_code : '',
                job_total: job.invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount_paid), 0)
            }
        }))
        setLoading(false);
    };

    const handleDownload = () => {
        if (tableRef.current) {
            tableRef.current.download('csv', `field_pulse_jobs_${Date.now()}.csv`);
        }
    }

    return (
        <>
            {loading && <div className="loading-screen">Loading...</div>}
            <div>
                <label htmlFor="start" >Start date:</label>
                <input
                    id="start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="end">End date:</label>
                <input
                    id="end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>
            <button onClick={handleClick}>Get Data</button>
            <button onClick={handleDownload}>Download Data</button>
            <div style={{ width: '100%', height: '100%' }} >
                <ReactTabulator
                    data={tableData}
                    columns={[
                        { title: 'id', field: 'id' },
                        { title: 'completed_at', field: 'completed_at' },
                        { title: 'job_type', field: 'job_type' },
                        { title: 'notes', field: 'notes' },
                        { title: 'customer_first_name', field: 'customer_first_name' },
                        { title: 'customer_last_name', field: 'customer_last_name' },
                        { title: 'address_1', field: 'address_1' },
                        { title: 'address_2', field: 'address_2' },
                        { title: 'address_3', field: 'address_3' },
                        { title: 'address_4', field: 'address_4' },
                        { title: 'address_5', field: 'address_5' },
                        { title: 'city', field: 'city' },
                        { title: 'state', field: 'state' },
                        { title: 'zip_code', field: 'zip_code' },
                        { title: 'job_total', field: 'job_total' }
                    ]}
                    layout={'fitData'}
                    onRef={(r) => (tableRef = r)}
                    options={{
                        pagination: "local",
                        paginationSize: 100,
                        downloadDataFormatter: (data) => data,
                        downloadReady: (fileContents, blob) => blob,
                    }}
                />
            </div>
        </>
    )
}

export default App
