import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: 'ru', // язык по умолчанию
    fallbackLng: 'ru',
    debug: true, // временно включите для отладки
    ns: ['common', 'profile', 'places', 'news', 'placeNewsDetail', 'loginRegister'], // явно укажите namespace'ы
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      crossDomain: true // если API на другом домене
    },
    interpolation: {
      escapeValue: false,
    },
    pluralSeparator: '||',
        // Добавляем поддержку плюрализации
    pluralization: {
      rules: {
        ru: function(choice, choicesLength) {
          if (choice === 0) return 0;
          
          const teen = choice > 10 && choice < 20;
          const endsWithOne = choice % 10 === 1;
          
          if (choicesLength < 4) {
            return (!teen && endsWithOne) ? 1 : 2;
          }
          if (!teen && endsWithOne) return 1;
          if (!teen && choice % 10 >= 2 && choice % 10 <= 4) return 2;
          return (choicesLength < 4) ? 2 : 3;
        }
      }
    }
  });

export default i18n;