/**
 * Hattrick Currency Constants
 * 
 * This file contains all currencies used in the Hattrick football management game
 * along with their conversion rates to USD. The rates represent how many units
 * of each currency equals 1 USD.
 * 
 * For example:
 * - USD: 1.0 (base currency)
 * - EUR: 1.0 (1 EUR = 1 USD for simplicity)
 * - RON: 0.05 (20 Lei = 1 USD)
 */

export interface Currency {
  code: string
  name: string
  symbol: string
  rate: number // How many units = 1 USD
  country?: string
}

export const HATTRICK_CURRENCIES: Currency[] = [
  // Major currencies
  { code: "USD", name: "US Dollar", symbol: "$", rate: 1.0, country: "United States" },
  { code: "EUR", name: "Euro", symbol: "€", rate: 1.0, country: "Eurozone" },
  { code: "GBP", name: "British Pound", symbol: "£", rate: 1.5, country: "United Kingdom" },
  
  // European currencies
  { code: "RON", name: "Romanian Leu", symbol: "lei", rate: 0.05, country: "Romania" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", rate: 0.1, country: "Sweden" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", rate: 0.1, country: "Norway" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", rate: 0.135, country: "Denmark" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", rate: 1.1, country: "Switzerland" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", rate: 0.25, country: "Poland" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", rate: 0.045, country: "Czech Republic" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", rate: 0.0028, country: "Hungary" },
  { code: "HRK", name: "Croatian Kuna", symbol: "kn", rate: 0.145, country: "Croatia" },
  { code: "RSD", name: "Serbian Dinar", symbol: "din", rate: 0.009, country: "Serbia" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв", rate: 0.55, country: "Bulgaria" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", rate: 0.011, country: "Russia" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", rate: 0.025, country: "Ukraine" },
  { code: "ISK", name: "Icelandic Krona", symbol: "kr", rate: 0.007, country: "Iceland" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", rate: 0.03, country: "Turkey" },
  
  // Asian currencies
  { code: "JPY", name: "Japanese Yen", symbol: "¥", rate: 0.0067, country: "Japan" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", rate: 0.14, country: "China" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", rate: 0.00075, country: "South Korea" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", rate: 0.012, country: "India" },
  { code: "THB", name: "Thai Baht", symbol: "฿", rate: 0.028, country: "Thailand" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", rate: 0.21, country: "Malaysia" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", rate: 0.74, country: "Singapore" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", rate: 0.13, country: "Hong Kong" },
  { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", rate: 0.031, country: "Taiwan" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", rate: 0.018, country: "Philippines" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", rate: 0.000065, country: "Indonesia" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", rate: 0.00004, country: "Vietnam" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", rate: 0.0083, country: "Bangladesh" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "Rs", rate: 0.0036, country: "Pakistan" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs", rate: 0.003, country: "Sri Lanka" },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸", rate: 0.002, country: "Kazakhstan" },
  
  // Middle East & Africa
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", rate: 0.27, country: "Saudi Arabia" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", rate: 0.27, country: "UAE" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪", rate: 0.27, country: "Israel" },
  { code: "EGP", name: "Egyptian Pound", symbol: "£", rate: 0.032, country: "Egypt" },
  { code: "ZAR", name: "South African Rand", symbol: "R", rate: 0.053, country: "South Africa" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", rate: 0.098, country: "Morocco" },
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", rate: 0.32, country: "Tunisia" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", rate: 0.0013, country: "Nigeria" },
  { code: "KES", name: "Kenyan Shilling", symbol: "Sh", rate: 0.0062, country: "Kenya" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", rate: 0.063, country: "Ghana" },
  
  // Americas
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", rate: 0.74, country: "Canada" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", rate: 0.05, country: "Mexico" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", rate: 0.18, country: "Brazil" },
  { code: "ARS", name: "Argentine Peso", symbol: "$", rate: 0.0008, country: "Argentina" },
  { code: "CLP", name: "Chilean Peso", symbol: "$", rate: 0.001, country: "Chile" },
  { code: "COP", name: "Colombian Peso", symbol: "$", rate: 0.00024, country: "Colombia" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/", rate: 0.27, country: "Peru" },
  { code: "UYU", name: "Uruguayan Peso", symbol: "$", rate: 0.025, country: "Uruguay" },
  { code: "BOB", name: "Bolivian Boliviano", symbol: "Bs", rate: 0.14, country: "Bolivia" },
  { code: "PYG", name: "Paraguayan Guarani", symbol: "₲", rate: 0.00014, country: "Paraguay" },
  { code: "VES", name: "Venezuelan Bolívar", symbol: "Bs.", rate: 0.000027, country: "Venezuela" },
  { code: "DOP", name: "Dominican Peso", symbol: "RD$", rate: 0.017, country: "Dominican Republic" },
  { code: "CRC", name: "Costa Rican Colón", symbol: "₡", rate: 0.0018, country: "Costa Rica" },
  { code: "GTQ", name: "Guatemalan Quetzal", symbol: "Q", rate: 0.13, country: "Guatemala" },
  { code: "HNL", name: "Honduran Lempira", symbol: "L", rate: 0.04, country: "Honduras" },
  { code: "NIO", name: "Nicaraguan Córdoba", symbol: "C$", rate: 0.027, country: "Nicaragua" },
  { code: "PAB", name: "Panamanian Balboa", symbol: "B/.", rate: 1.0, country: "Panama" },
  { code: "JMD", name: "Jamaican Dollar", symbol: "J$", rate: 0.0065, country: "Jamaica" },
  { code: "TTD", name: "Trinidad and Tobago Dollar", symbol: "TT$", rate: 0.15, country: "Trinidad and Tobago" },
  
  // Oceania
  { code: "AUD", name: "Australian Dollar", symbol: "A$", rate: 0.65, country: "Australia" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", rate: 0.6, country: "New Zealand" },
  
  // Additional European
  { code: "MDL", name: "Moldovan Leu", symbol: "L", rate: 0.055, country: "Moldova" },
  { code: "MKD", name: "Macedonian Denar", symbol: "ден", rate: 0.018, country: "North Macedonia" },
  { code: "ALL", name: "Albanian Lek", symbol: "L", rate: 0.01, country: "Albania" },
  { code: "BAM", name: "Bosnia and Herzegovina Mark", symbol: "КМ", rate: 0.55, country: "Bosnia and Herzegovina" },
  { code: "GEL", name: "Georgian Lari", symbol: "₾", rate: 0.37, country: "Georgia" },
  { code: "AMD", name: "Armenian Dram", symbol: "֏", rate: 0.0026, country: "Armenia" },
  { code: "AZN", name: "Azerbaijani Manat", symbol: "₼", rate: 0.59, country: "Azerbaijan" },
  { code: "BYN", name: "Belarusian Ruble", symbol: "Br", rate: 0.31, country: "Belarus" },
  { code: "LTL", name: "Lithuanian Litas", symbol: "Lt", rate: 0.29, country: "Lithuania" },
  { code: "LVL", name: "Latvian Lats", symbol: "Ls", rate: 1.43, country: "Latvia" },
  { code: "EEK", name: "Estonian Kroon", symbol: "kr", rate: 0.064, country: "Estonia" },
  
  // Additional currencies from smaller countries
  { code: "FJD", name: "Fijian Dollar", symbol: "FJ$", rate: 0.44, country: "Fiji" },
  { code: "TOP", name: "Tongan Paʻanga", symbol: "T$", rate: 0.43, country: "Tonga" },
  { code: "WST", name: "Samoan Tala", symbol: "WS$", rate: 0.37, country: "Samoa" },
  { code: "VUV", name: "Vanuatu Vatu", symbol: "VT", rate: 0.0084, country: "Vanuatu" },
  { code: "PGK", name: "Papua New Guinea Kina", symbol: "K", rate: 0.26, country: "Papua New Guinea" },
  { code: "SBD", name: "Solomon Islands Dollar", symbol: "SI$", rate: 0.12, country: "Solomon Islands" },
  { code: "NCK", name: "New Caledonian Franc", symbol: "₣", rate: 0.0084, country: "New Caledonia" },
  { code: "XPF", name: "CFP Franc", symbol: "₣", rate: 0.0084, country: "French Polynesia" },
  
  // Additional African currencies
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA", rate: 0.0017, country: "West Africa" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", rate: 0.0017, country: "Central Africa" },
  { code: "BWP", name: "Botswana Pula", symbol: "P", rate: 0.074, country: "Botswana" },
  { code: "NAD", name: "Namibian Dollar", symbol: "N$", rate: 0.053, country: "Namibia" },
  { code: "SZL", name: "Swazi Lilangeni", symbol: "E", rate: 0.053, country: "Eswatini" },
  { code: "LSL", name: "Lesotho Loti", symbol: "M", rate: 0.053, country: "Lesotho" },
  { code: "MWK", name: "Malawian Kwacha", symbol: "MK", rate: 0.00097, country: "Malawi" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", rate: 0.037, country: "Zambia" },
  { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", rate: 0.0012, country: "Angola" },
  { code: "MZN", name: "Mozambican Metical", symbol: "MT", rate: 0.016, country: "Mozambique" },
  { code: "MGA", name: "Malagasy Ariary", symbol: "Ar", rate: 0.00022, country: "Madagascar" },
  { code: "MUR", name: "Mauritian Rupee", symbol: "₨", rate: 0.022, country: "Mauritius" },
  { code: "SCR", name: "Seychellois Rupee", symbol: "₨", rate: 0.074, country: "Seychelles" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", rate: 0.018, country: "Ethiopia" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", rate: 0.00027, country: "Uganda" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", rate: 0.00042, country: "Tanzania" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw", rate: 0.00077, country: "Rwanda" },
  { code: "BIF", name: "Burundian Franc", symbol: "FBu", rate: 0.00035, country: "Burundi" },
  { code: "DJF", name: "Djiboutian Franc", symbol: "Fdj", rate: 0.0056, country: "Djibouti" },
  { code: "ERN", name: "Eritrean Nakfa", symbol: "Nfk", rate: 0.067, country: "Eritrea" },
  { code: "SOS", name: "Somali Shilling", symbol: "Sh", rate: 0.0017, country: "Somalia" },
  { code: "SDG", name: "Sudanese Pound", symbol: "ج.س.", rate: 0.0017, country: "Sudan" },
  { code: "SLL", name: "Sierra Leonean Leone", symbol: "Le", rate: 0.000048, country: "Sierra Leone" },
  { code: "LRD", name: "Liberian Dollar", symbol: "L$", rate: 0.0053, country: "Liberia" },
  { code: "GMD", name: "Gambian Dalasi", symbol: "D", rate: 0.015, country: "Gambia" },
  { code: "GNF", name: "Guinean Franc", symbol: "FG", rate: 0.00012, country: "Guinea" },
  { code: "CVE", name: "Cape Verdean Escudo", symbol: "$", rate: 0.01, country: "Cape Verde" }
]

/**
 * Get a currency by its code
 */
export function getCurrencyByCode(code: string): Currency | undefined {
  return HATTRICK_CURRENCIES.find(currency => currency.code === code)
}

/**
 * Convert amount from one currency to another using USD as intermediate
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  const fromCurrencyData = getCurrencyByCode(fromCurrency)
  const toCurrencyData = getCurrencyByCode(toCurrency)
  
  if (!fromCurrencyData || !toCurrencyData) {
    throw new Error(`Currency not found: ${fromCurrency} or ${toCurrency}`)
  }
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount * fromCurrencyData.rate
  return amountInUSD / toCurrencyData.rate
}

/**
 * Convert amount from any currency to USD
 */
export function convertToUSD(amount: number, fromCurrency: string): number {
  const currencyData = getCurrencyByCode(fromCurrency)
  if (!currencyData) {
    throw new Error(`Currency not found: ${fromCurrency}`)
  }
  return amount * currencyData.rate
}

/**
 * Convert amount from USD to any currency
 */
export function convertFromUSD(amountUSD: number, toCurrency: string): number {
  const currencyData = getCurrencyByCode(toCurrency)
  if (!currencyData) {
    throw new Error(`Currency not found: ${toCurrency}`)
  }
  return amountUSD / currencyData.rate
}

/**
 * Format currency amount with proper symbol and locale formatting
 */
export function formatCurrency(
  amount: number, 
  currencyCode: string,
  options?: {
    showSymbol?: boolean
    showCode?: boolean
    decimals?: number
  }
): string {
  const currency = getCurrencyByCode(currencyCode)
  if (!currency) {
    return amount.toString()
  }
  
  const {
    showSymbol = true,
    showCode = false,
    decimals = 0
  } = options || {}
  
  const formattedAmount = amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
  
  let result = formattedAmount
  
  if (showSymbol && currency.symbol) {
    // For most currencies, symbol goes before
    if (['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'CHF'].includes(currencyCode)) {
      result = `${currency.symbol}${formattedAmount}`
    } else {
      result = `${formattedAmount} ${currency.symbol}`
    }
  }
  
  if (showCode) {
    result = `${result} ${currencyCode}`
  }
  
  return result
}

/**
 * Get default currency (USD)
 */
export const DEFAULT_CURRENCY = HATTRICK_CURRENCIES.find(c => c.code === 'USD')!

/**
 * Get popular currencies for quick selection
 */
export const POPULAR_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'RON', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF',
  'BRL', 'ARS', 'MXN', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'RUB', 'TRY'
].map(code => getCurrencyByCode(code)!).filter(Boolean)