import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../components/redux/store'; // Import the root reducer
import { db } from '../../../../../firebase-config';
import { doc, getDoc } from 'firebase/firestore';

const ApplicationViewer: React.FC = () => {
  const selectedFormId = useSelector((state: RootState) => state.form.selectedFormId);

  useEffect(() => {
    const fetchFormData = async () => {
      if (selectedFormId) {
        try {
          // Fetch the form data based on the selectedFormId from Firestore
          const formDoc = await getDoc(doc(db, 'default_forms', selectedFormId));
          const formData = formDoc.data();

          // Use the fetched formData to render the form
          // ...
        } catch (error) {
          console.error('Error fetching form data:', error);
        }
      }
    };

    fetchFormData();
  }, [selectedFormId]);

  return (
    <div>
    </div>
    );
};

export default ApplicationViewer;