import type {KeysData} from '@gravity-ui/i18n';
import {I18N} from '@gravity-ui/i18n';
import {configure as configureUiKit} from '@gravity-ui/uikit';

import {settingsManager} from '../../services/settings';
import {LANGUAGE_KEY} from '../constants';

enum Lang {
    En = 'en',
    Ru = 'ru',
}

const defaultLang = Lang.En;
const currentLang = settingsManager.readUserSettingsValue(LANGUAGE_KEY, defaultLang) as Lang;

const i18n = new I18N({
    lang: currentLang,

    // Enable keysets with only en lang
    fallbackLang: Lang.En,
});

configureUiKit({lang: currentLang});

export function registerKeysets<Keyset extends KeysData>(id: string, data: Record<string, Keyset>) {
    type Keys = Extract<keyof Keyset, string>;

    for (const lang of Object.keys(data)) {
        i18n.registerKeyset(lang, id, data[lang]);
    }

    return i18n.keyset<Keys>(id);
}

export {i18n, Lang, currentLang, defaultLang};
