import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const PriceChart = ({ priceHistory = [] }) => {
  const chartData = {
    labels: priceHistory.map((entry) =>
      new Date(entry.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    ),
    datasets: [
      {
        label: 'Price History',
        data: priceHistory.map((entry) => entry.price),
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, 
    scales: {
      x: {
        display: true,
        title: { display: true, text: 'Time' },
      },
      y: {
        display: true,
        title: { display: true, text: 'Price' },
      },
    },
    plugins: {
      legend: { display: true },
    },
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PriceChart;
