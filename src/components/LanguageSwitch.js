import '../static/style/LanguageSwitch.css';
import '../static/style/Header.css';

const LanguageSwitch = (props) => (
  <>
    <span className="language-switch">
      <button
        className={`${props.polyglot.currentLocale === 'el' ? 'active' : ''}`}
        onClick={() => props.handleLanguage('el')}
      >
        EL
      </button>
      |
      <button
        className={`${props.polyglot.currentLocale === 'en' ? 'active' : ''}`}
        onClick={() => props.handleLanguage('en')}
      >
        EN
      </button>
    </span>
  </>
);

export default LanguageSwitch;
