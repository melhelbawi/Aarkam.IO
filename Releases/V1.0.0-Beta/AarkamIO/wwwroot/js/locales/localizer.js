import en from "./en.js?v=7";
import ar from "./ar.js?v=7";

// Import StorageRegion locales (relative to current directory)
import storageRegionsEn from "../../../Pages/StorageRegions/VueComponents/locales/en.js?v=6";
import storageRegionsAr from "../../../Pages/StorageRegions/VueComponents/locales/ar.js?v=6";
import storageObjectsEn from "../../../Pages/StorageObjects/VueComponents/locales/en.js?v=6";
import storageObjectsAr from "../../../Pages/StorageObjects/VueComponents/locales/ar.js?v=6";

const { createI18n } = VueI18n;

function deepMerge(target, source) {
    const combined = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key]) {
            combined[key] = deepMerge(target[key], source[key]);
        } else {
            combined[key] = source[key];
        }
    }
    return combined;
}

const messages = {
    en: deepMerge(deepMerge(en, storageRegionsEn), storageObjectsEn),
    ar: deepMerge(deepMerge(ar, storageRegionsAr), storageObjectsAr)
};

const i18n = createI18n({
    legacy: true,
    globalInjection: true,
    locale: localStorage.getItem('user-locale') || document.documentElement.lang || 'en',
    fallbackLocale: 'en',
    messages,
});

export default i18n;