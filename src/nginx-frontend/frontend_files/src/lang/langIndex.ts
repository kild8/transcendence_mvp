import en from "./en.js";
import fr from "./fr.js";
import de from "./de.js";

export const translations = { en, fr, de };

// main function to translate the message to the language of the client. takes the lang as stocked in state, and the options like name, email, etc..
export function t(lang: keyof typeof translations, key: string, options?: Record<string, string | number>): string {
  let text = key.split('.').reduce((obj: any, k) => obj?.[k], translations[lang]) || key;

  //Regex is used to search all the occurence of a variable and replace them. for example {name} becomes Alice
  if (options) {
    Object.keys(options).forEach(opt => {
      const regex = new RegExp(`{${opt}}`, 'g');
      text = text.replace(regex, options[opt]);
    });
  }

  return text;
}
 //ex const msg = t("fr", "ADD_USER.MSG_USER_ADDED", { name: "Alice", email: "alice@test.com" });