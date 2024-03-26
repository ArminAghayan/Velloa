export interface UnitData {
    key: string;
    unitNumber: number;
    floor: number;
    unitPrice: number;
    propertyId: string;
  }
  
  export const SET_SELECTED_UNIT = 'SET_SELECTED_UNIT';
  
  export const setSelectedUnit = (unit: UnitData) => ({
    type: SET_SELECTED_UNIT,
    payload: unit,
  });