const fs = require('fs');
const path = require('path');

const locales = {
    uz: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/uz.json'), 'utf8')).uz,
    ru: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/ru.json'), 'utf8')).ru
};

function get(key, lang = 'uz') {
    const l = locales[lang] || locales.uz;
    return l[key] || key;
}

module.exports = { get };
