import { useParams } from 'react-router-dom';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header/UserHeader';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import './UserLayout.css';

const { Content } = Layout;

const UserLayout: React.FC = () => {
  const { companyId = '' } = useParams();
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const fetchCompanyName = async () => {
      if (!companyId) return;
      
      try {
        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        if (companyDoc.exists()) {
          setCompanyName(companyDoc.data().companyName || '');
        }
      } catch (error) {
        console.error('Error fetching company name:', error);
      }
    };

    fetchCompanyName();
  }, [companyId]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header companyId={companyId} />
      <Content className="user-layout-content">
        <Outlet context={{ companyName }} />
      </Content>
    </Layout>
  );
};

export default UserLayout; 