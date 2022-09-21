import React, { useRef, useState } from 'react';
import moment from 'moment';
import { Tooltip } from './Tooltip';

import './Form.css';
import '../../App.css';

export const Form = (props) => (
  <form className={`Form ${props.className}`}>{props.children}</form>
);

export const FormGroup = (props) => (
  <div className="Group">{props.children}</div>
);

export const InputGroup = (props) => (
  <div className="input-group">{props.children}</div>
);

const Label = (props) => (
  <>
    {props.tooltip ? (
      <label htmlFor={props.id}>
        <Tooltip tip={props.tooltip}>
          <span className="tooltip-label">{props.label}</span>
        </Tooltip>
      </label>
    ) : (
      <label htmlFor={props.id}>{props.label}</label>
    )}
  </>
);

export const TextInput = (props) => (
  <>
    <InputGroup>
      {props.label && (
        <Label tooltip={props.tooltip} id={props.id} label={props.label} />
      )}
      <input
        tooltip={props.tooltip}
        id={props.id}
        className={props.label ? 'labeled' : ''}
        type={props.type != undefined ? props.type : 'text'}
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        maxLength={props.maxLength}
        minLength={props.minLength}
      />
    </InputGroup>
  </>
);

export const Dropdown = (props) => (
  <>
    <InputGroup>
      {props.label && (
        <Label tooltip={props.tooltip} id={props.id} label={props.label} />
      )}
      <select
        onChange={props.onChange}
        className={props.label ? 'labeled' : ''}
      >
        <option value="" className="placeholder" selected disabled>
          {props.placeholder}
        </option>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </InputGroup>
  </>
);

export const DateInput = (props) => {
  const monthRef = useRef();
  const yearRef = useRef();

  const [day, setDay] = useState(props.day);
  const [month, setMonth] = useState(props.month);
  const [year, setYear] = useState(props.year);

  const handleDay = (e) => {
    const target = e.currentTarget;
    const value = target.value.replace(/\D/g, '');
    setDay(value);
    if (parseInt(value) > 0 && value.length === 2 && parseInt(value) <= 31) {
      monthRef.current.focus();
      monthRef.current.select();
    }
  };

  const handleMonth = (e) => {
    const target = e.currentTarget;
    const value = target.value.replace(/\D/g, '');
    setMonth(value);
    if (parseInt(value) > 0 && value.length === 2 && parseInt(value) <= 12) {
      yearRef.current.focus();
      yearRef.current.select();
    }
  };

  const handleYear = (e) => {
    const target = e.currentTarget;
    const value = target.value.replace(/\D/g, '');
    setYear(value);
  };

  const dayIsValid = () => parseInt(props.day) > 0 && parseInt(props.day) <= 31;

  const monthIsValid = () =>
    parseInt(props.month) > 0 && parseInt(props.month) <= 12;

  const yearIsValid = () =>
    parseInt(props.year) > 0 &&
    parseInt(props.year) <= new Date().getFullYear();

  const dateIsValid = () => {
    const validDay = dayIsValid();
    const validMonth = monthIsValid();
    const validYear = yearIsValid();
    let dateIsValid = validDay && validMonth && validYear;
    if (dateIsValid) {
      const date = moment(`${props.year}-${props.month}-${props.day}`);
      dateIsValid = date.isValid();
    }
    return dateIsValid;
  };

  const handleDate = () => {
    let isValid = true;
    if (props.day && props.month && props.year) {
      isValid = dateIsValid();
    }
    props.handleError(!isValid);
  };

  const formatDay = (e) => {
    const target = e.currentTarget;
    let day = target.value;
    if (day.length === 1 && parseInt(day) >= 1 && parseInt(day) <= 9) {
      day = `0${day}`;
    }
    setDay(day);
    props.handleDay(day);
    handleDate();
  };

  const formatMonth = (e) => {
    const target = e.currentTarget;
    let month = target.value;
    if (month.length === 1 && parseInt(month) >= 1 && parseInt(month) <= 9) {
      month = `0${month}`;
    }
    setMonth(month);
    props.handleMonth(month);
    handleDate();
  };

  const formatYear = (e) => {
    const target = e.currentTarget;
    let year = target.value;
    if (year.length === 2) {
      const currentYear = new Date().getFullYear().toString();
      if (props.year.slice(-2) < currentYear.slice(-2)) {
        year = `20${year}`;
      } else {
        year = `19${year}`;
      }
    }
    setYear(year);
    props.handleYear(year);
    handleDate();
  };

  return (
    <>
      <InputGroup>
        {props.label && (
          <Label tooltip={props.tooltip} id={props.id} label={props.label} />
        )}
        <input
          className="date"
          type="text"
          value={day}
          onChange={handleDay}
          onBlur={formatDay}
        />
        <label className="small">/</label>
        <input
          ref={monthRef}
          className="date"
          type="text"
          value={month}
          onChange={handleMonth}
          onBlur={formatMonth}
        />
        <label className="small">/</label>
        <input
          ref={yearRef}
          className="date"
          type="text"
          value={year}
          onChange={handleYear}
          onBlur={formatYear}
        />
      </InputGroup>
    </>
  );
};
