import React from 'react';
import Select from 'react-select';
import { CustomSelectProps } from '../../interfaces/SelectProps';
import './CustomSelect.css';

const CustomSelect: React.FC<CustomSelectProps> = ({items, isMulti, err, onChange}) => {

  return(
    <Select
          className={`dropdown ${err ? "error" : ""}`}
          theme={(theme: any) => ({
            ...theme,
            borderRadius: 5,
            paddingTop: 10,
            colors: {
              ...theme.colors,
              primary: err ? '#ff0000' : '#003476',
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
					isMulti={isMulti}
        />
  );
}

export default CustomSelect;