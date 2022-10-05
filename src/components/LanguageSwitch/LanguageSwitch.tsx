import './LanguageSwitch.css';
import '../Header/Header.css';
import Polyglot from 'node-polyglot';

export interface LanguageSwitchProps {
	polyglot: Polyglot;
	handleLanguage(lang: string): void;
}

const LanguageSwitch: React.FC<LanguageSwitchProps> = ({polyglot, handleLanguage}) => (
  <>
    <span className="language-switch">
      <button
        className={`${polyglot.locale() === 'el' ? 'active' : ''}`}
        onClick={() => handleLanguage('el')}
      >
        EL
      </button>
      |
      <button
        className={`${polyglot.locale() === 'en' ? 'active' : ''}`}
        onClick={() => handleLanguage('en')}
      >
        EN
      </button>
    </span>
  </>
);

export default LanguageSwitch;
