// src/pages/UnitInfo/UnitInfo.tsx
import { useSelector } from 'react-redux';
import { RootState } from '../../../components/store';


const UnitInfoPage: React.FC = () => {
    const selectedUnit = useSelector((state: RootState) => state.property.selectedUnit);
        console.log('Selected Unit in UnitInfoPage:', selectedUnit);
  
    return (
        <div>
          <h2>Unit Info</h2>
          {selectedUnit ? (
            <>
              <p>Unit Number: {selectedUnit.unitNumber}</p>
              <p>Floor: {selectedUnit.floor}</p>
              <p>Unit Price: {selectedUnit.unitPrice}</p>
            </>
          ) : (
            <p>No unit selected.</p>
          )}
        </div>
      );
  };
  
  export default UnitInfoPage;