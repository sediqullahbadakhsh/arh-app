// src/acl/permissions.js

// High-level roles (can expand later)
export const ROLES = {
  B2C: "b2c",
  B2B: "b2b",
};

// Canonical screen ids (match your navigator names)
export const SCREENS = {
  WELCOME: "Welcome",
  LOGIN: "Login",
  SIGNUP: "SignUp",
  TABS: "Tabs",
  HOME: "HomeMain",
  TRANSACTIONS: "Transactions",
  CONTACTS: "Contacts",
  PROFILE: "Profile",

  // Topup/Data flow
  TOPUP_PRODUCTS: "TopupProducts",
  TOPUP_FORM: "TopupForm",
  TOPUP_PAYMENT: "TopupPayment",
  TOPUP_RESULT: "TopupResult",
  DATA_COUNTRY: "DataCountry",
  DATA_PRODUCTS: "DataProducts",
  DATA_PHONE: "DataPhone",
  DATA_PAYMENT: "DataPayment",
  DATA_RESULT: "DataResult",
};

// Optional fine-grained actions to gate sections/buttons
export const ACTIONS = {
  VIEW_BALANCE: "view_balance",
  VIEW_COMMISSION_WALLET: "view_commission_wallet",
  MAKE_TOPUP: "make_topup",
  BUY_DATA: "buy_data",
  SEE_TRANSACTIONS: "see_transactions",
  EXPORT_RECEIPT: "export_receipt",
  INVITE_TEAM: "invite_team",
  SEE_CONTACTS: "see_contacts",
  SEE_NOTIFICATIONS: "see_notifications",
  SEE_PROFILE: "see_profile",
  USE_CONTACT_PICKER: "use_contact_picker",
};

// Per role, define which screens are visible and which actions are allowed
export const ROLE_RULES = {
  [ROLES.B2C]: {
    screens: [
      SCREENS.TABS,
      SCREENS.HOME,
      SCREENS.TRANSACTIONS,
      SCREENS.CONTACTS,
      SCREENS.PROFILE,
      SCREENS.TOPUP_PRODUCTS,
      SCREENS.TOPUP_FORM,
      SCREENS.TOPUP_PAYMENT,
      SCREENS.TOPUP_RESULT,
      SCREENS.DATA_COUNTRY,
      SCREENS.DATA_PRODUCTS,
      SCREENS.DATA_PHONE,
      SCREENS.DATA_PAYMENT,
      SCREENS.DATA_RESULT,
    ],
    actions: [
      ACTIONS.VIEW_BALANCE,
      ACTIONS.MAKE_TOPUP,
      ACTIONS.BUY_DATA,
      ACTIONS.SEE_TRANSACTIONS,
      ACTIONS.SEE_CONTACTS,
      ACTIONS.SEE_PROFILE,
      ACTIONS.SEE_NOTIFICATIONS,
      ACTIONS.USE_CONTACT_PICKER,
      ACTIONS.EXPORT_RECEIPT,
      // no commission wallet, no team invites
    ],
  },

  [ROLES.B2B]: {
    screens: [
      SCREENS.TABS,
      SCREENS.HOME,
      SCREENS.TRANSACTIONS,
      SCREENS.CONTACTS,
      SCREENS.PROFILE,
      SCREENS.TOPUP_PRODUCTS,
      SCREENS.TOPUP_FORM,
      SCREENS.TOPUP_PAYMENT,
      SCREENS.TOPUP_RESULT,
      SCREENS.DATA_COUNTRY,
      SCREENS.DATA_PRODUCTS,
      SCREENS.DATA_PHONE,
      SCREENS.DATA_PAYMENT,
      SCREENS.DATA_RESULT,
    ],
    actions: [
      ACTIONS.VIEW_BALANCE,
      ACTIONS.VIEW_COMMISSION_WALLET,
      ACTIONS.MAKE_TOPUP,
      ACTIONS.BUY_DATA,
      ACTIONS.SEE_TRANSACTIONS,
      ACTIONS.SEE_CONTACTS,
      ACTIONS.SEE_PROFILE,
      ACTIONS.SEE_NOTIFICATIONS,
      ACTIONS.USE_CONTACT_PICKER,
      ACTIONS.EXPORT_RECEIPT,
      ACTIONS.INVITE_TEAM,
    ],
  },
};

// Convenience guards
export function canUseScreen(role, screenName) {
  const rule = ROLE_RULES[role];
  return !!rule && rule.screens.includes(screenName);
}

export function can(role, action) {
  const rule = ROLE_RULES[role];
  return !!rule && rule.actions.includes(action);
}
