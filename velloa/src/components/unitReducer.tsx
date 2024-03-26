import { SET_SELECTED_UNIT, UnitData } from './unitActions';

interface UnitState {
  selectedUnit: UnitData | null;
}

const initialState: UnitState = {
  selectedUnit: null,
};

const unitReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case SET_SELECTED_UNIT:
      return {
        ...state,
        selectedUnit: action.payload,
      };
    default:
      return state;
  }
};

export default unitReducer;