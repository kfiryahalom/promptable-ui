// Resource 1: individual stocks
export const mockStocks = [
  { symbol: 'AAPL',  name: 'Apple Inc.',         price: 182.52, change:  2.34, changePct:  1.30, volume: 58_420_000, marketCap: 2_850_000_000_000, sector: 'Technology', peRatio: 28.4 },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',     price: 415.20, change: -1.80, changePct: -0.43, volume: 22_100_000, marketCap: 3_090_000_000_000, sector: 'Technology', peRatio: 35.1 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',        price: 165.43, change:  0.95, changePct:  0.58, volume: 18_300_000, marketCap: 2_060_000_000_000, sector: 'Technology', peRatio: 25.2 },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',      price: 189.12, change:  3.21, changePct:  1.73, volume: 42_500_000, marketCap: 1_980_000_000_000, sector: 'Consumer',   peRatio: 58.6 },
  { symbol: 'META',  name: 'Meta Platforms',       price: 489.30, change:  7.82, changePct:  1.62, volume: 19_800_000, marketCap: 1_250_000_000_000, sector: 'Technology', peRatio: 26.8 },
  { symbol: 'TSLA',  name: 'Tesla Inc.',           price: 243.15, change: -8.45, changePct: -3.36, volume: 85_600_000, marketCap:   776_000_000_000, sector: 'Automotive', peRatio: 65.3 },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.',         price: 875.42, change: 24.18, changePct:  2.84, volume: 48_200_000, marketCap: 2_160_000_000_000, sector: 'Technology', peRatio: 72.1 },
  { symbol: 'JPM',   name: 'JPMorgan Chase',       price: 198.76, change:  0.43, changePct:  0.22, volume: 11_400_000, marketCap:   575_000_000_000, sector: 'Finance',    peRatio: 12.4 },
  { symbol: 'JNJ',   name: 'Johnson & Johnson',    price: 147.23, change: -2.15, changePct: -1.44, volume:  8_900_000, marketCap:   354_000_000_000, sector: 'Healthcare', peRatio: 15.7 },
  { symbol: 'WMT',   name: 'Walmart Inc.',         price: 163.45, change:  1.12, changePct:  0.69, volume: 15_200_000, marketCap:   521_000_000_000, sector: 'Consumer',   peRatio: 30.2 },
  { symbol: 'XOM',   name: 'Exxon Mobil Corp.',   price: 112.87, change: -0.34, changePct: -0.30, volume: 18_700_000, marketCap:   453_000_000_000, sector: 'Energy',     peRatio: 14.1 },
  { symbol: 'BAC',   name: 'Bank of America',      price:  38.92, change:  0.28, changePct:  0.72, volume: 42_300_000, marketCap:   305_000_000_000, sector: 'Finance',    peRatio: 11.8 },
];

// Resource 2: major market indices
export const mockIndices = [
  { index: 'S&P 500', value:  5234.18, change:  12.45, changePct:  0.24, ytdChange:  8.2 },
  { index: 'NASDAQ',  value: 16420.98, change: -23.12, changePct: -0.14, ytdChange:  6.7 },
  { index: 'DOW',     value: 39103.42, change: 145.67, changePct:  0.37, ytdChange:  4.1 },
  { index: 'Russell', value:  2042.15, change:  -8.45, changePct: -0.41, ytdChange: -1.3 },
];

// Resource 3: recent earnings beats/misses — joinable with stocks on `symbol`
export const mockEarnings = [
  { symbol: 'AAPL',  quarter: 'Q4-2023', epsActual: 2.18, epsEstimate: 2.10, revActual: 119.6, revEstimate: 117.9, beat: true  },
  { symbol: 'MSFT',  quarter: 'Q4-2023', epsActual: 2.93, epsEstimate: 2.78, revActual:  62.0, revEstimate:  61.1, beat: true  },
  { symbol: 'GOOGL', quarter: 'Q4-2023', epsActual: 1.64, epsEstimate: 1.59, revActual:  86.3, revEstimate:  85.3, beat: true  },
  { symbol: 'AMZN',  quarter: 'Q4-2023', epsActual: 1.00, epsEstimate: 0.80, revActual: 170.0, revEstimate: 166.2, beat: true  },
  { symbol: 'META',  quarter: 'Q4-2023', epsActual: 5.33, epsEstimate: 4.96, revActual:  40.1, revEstimate:  39.2, beat: true  },
  { symbol: 'TSLA',  quarter: 'Q4-2023', epsActual: 0.71, epsEstimate: 0.74, revActual:  25.2, revEstimate:  25.9, beat: false },
  { symbol: 'NVDA',  quarter: 'Q4-2023', epsActual: 5.16, epsEstimate: 4.64, revActual:  22.1, revEstimate:  20.4, beat: true  },
  { symbol: 'JPM',   quarter: 'Q4-2023', epsActual: 3.97, epsEstimate: 3.62, revActual:  38.6, revEstimate:  39.9, beat: false },
  { symbol: 'JNJ',   quarter: 'Q4-2023', epsActual: 2.29, epsEstimate: 2.28, revActual:  21.4, revEstimate:  21.0, beat: true  },
  { symbol: 'TSLA',  quarter: 'Q3-2023', epsActual: 0.66, epsEstimate: 0.73, revActual:  23.4, revEstimate:  24.1, beat: false },
  { symbol: 'AAPL',  quarter: 'Q3-2023', epsActual: 1.46, epsEstimate: 1.39, revActual:  89.5, revEstimate:  89.3, beat: true  },
];

// Resource 4: analyst ratings — joinable with stocks on `symbol`
export const mockAnalysts = [
  { symbol: 'AAPL',  firm: 'Goldman Sachs', rating: 'Buy',         priceTarget: 210, prevTarget: 195, date: '2024-01-15' },
  { symbol: 'MSFT',  firm: 'Morgan Stanley', rating: 'Overweight', priceTarget: 450, prevTarget: 420, date: '2024-01-18' },
  { symbol: 'GOOGL', firm: 'JPMorgan',       rating: 'Overweight', priceTarget: 195, prevTarget: 180, date: '2024-01-12' },
  { symbol: 'NVDA',  firm: 'Citi',           rating: 'Buy',         priceTarget: 1000,prevTarget: 850, date: '2024-01-20' },
  { symbol: 'TSLA',  firm: 'Morgan Stanley', rating: 'Underweight',priceTarget: 200, prevTarget: 250, date: '2024-01-10' },
  { symbol: 'META',  firm: 'Goldman Sachs', rating: 'Buy',         priceTarget: 530, prevTarget: 475, date: '2024-01-16' },
  { symbol: 'AMZN',  firm: 'Barclays',       rating: 'Overweight', priceTarget: 215, prevTarget: 200, date: '2024-01-14' },
  { symbol: 'JPM',   firm: 'Wells Fargo',    rating: 'Overweight', priceTarget: 215, prevTarget: 205, date: '2024-01-08' },
  { symbol: 'JNJ',   firm: 'UBS',            rating: 'Neutral',    priceTarget: 155, prevTarget: 165, date: '2024-01-11' },
  { symbol: 'XOM',   firm: 'TD Cowen',       rating: 'Buy',         priceTarget: 130, prevTarget: 120, date: '2024-01-09' },
];
