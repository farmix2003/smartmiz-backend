const i18next = require('i18next');
const middleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');

i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
        fallbackLng: 'uz',
        backend: {
            loadPath: './locales/{{lng}}/transilation.json'
        },
        detection: {
            order: ['querystring', 'cookie', 'header'],
            caches: ['cookie']
        }
    });

module.exports = i18next;
