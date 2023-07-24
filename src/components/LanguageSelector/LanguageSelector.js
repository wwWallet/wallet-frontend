import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const { language } = i18n;

  const languageOptions = [
    { value: 'en', label: '🇺🇸 English' },
    { value: 'el', label: '🇬🇷 Ελληνικά' },
  ];

  const handleChangeLanguage = (event) => {
    const selectedLanguage = event.target.value;
    i18n.changeLanguage(selectedLanguage);
  };

  return (
    <select
      className="p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      value={language}
      onChange={handleChangeLanguage}
    >
      {languageOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;
