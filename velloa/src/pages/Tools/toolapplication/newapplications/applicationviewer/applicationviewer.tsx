import { useLocation } from 'react-router-dom';
import { Typography } from 'antd';

interface DefaultForm {
  key: string;
  id: string;
  title: string;
  description: string;
}

const ApplicationViewer: React.FC = () => {
  const location = useLocation();
  const { form } = location.state as { form: DefaultForm };

  return (
    <div>
      <Typography.Title level={2}>Application Viewer</Typography.Title>
      <Typography.Paragraph>
        <strong>Title:</strong> {form.title}
      </Typography.Paragraph>
      <Typography.Paragraph>
        <strong>Description:</strong> {form.description}
      </Typography.Paragraph>
      {/* Add more fields and components to display the form data */}
    </div>
  );
};

export default ApplicationViewer;