import React from 'react';
import Select from 'react-select';
import { CustomSelectProps } from '../../interfaces/SelectProps';
import './CustomSelect.css';

const CustomSelect: React.FC<CustomSelectProps> = ({items, onChange}) => {

  return(
    <Select
          className="dropdown"
          theme={(theme: any) => ({
            ...theme,
            borderRadius: 5,
            paddingTop: 10,
            colors: {
              ...theme.colors,
              primary: '#003476',
              primary25: 'rgb(224, 224, 224)'
            }
          })}
          styles={{
            container: (provided: any) => ({
              ...provided,
              paddingTop: 5
            })
          }}
          options={items}
          onChange={onChange}
          isSearchable
        />
  );
}

export default CustomSelect;