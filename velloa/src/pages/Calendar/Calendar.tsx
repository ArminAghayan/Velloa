import React from 'react';
import { Calendar as AntCalendar, Typography } from 'antd';
import { Dayjs } from 'dayjs';
import './Calendar.css';

const { Title } = Typography;

const Calendar: React.FC = () => {
  const onSelect = (date: Dayjs) => {
    console.log('Selected date:', date.format('YYYY-MM-DD'));
  };

  const onPanelChange = (date: Dayjs, mode: string) => {
    console.log('Panel changed:', date.format('YYYY-MM-DD'), mode);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={1} style={{ textAlign: 'left', marginTop: '0px', marginBottom: '20px' }}>
        Calendar
      </Title>
      <div className="property-page-container">
        <AntCalendar 
          onSelect={onSelect}
          onPanelChange={onPanelChange}
          fullscreen={true}
        />
      </div>
    </div>
  );
};

export default Calendar;
