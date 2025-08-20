// Simple test of export functionality
const { generatePlayersCSV, formatPlayerForCSV } = require('./src/lib/export.ts');

const testPlayer = {
  id: 'test-1',
  name: 'Test Player',
  age: '25y 30d',
  position: 'Forward',
  nationality: 'Sweden',
  speciality: 'Quick',
  form: 8,
  stamina: 7,
  keeper: undefined,
  defending: 5,
  playmaking: 12,
  winger: 8,
  passing: 10,
  scoring: 15,
  setPieces: 6,
  purchaseDate: '2023-01-15',
  purchasePrice: 500000,
  fromTeam: 'Test FC',
  currentStatus: 'OWNED',
  totalProfit: 150000,
  weeksOwned: 20,
  projectedProfit: 200000
};

console.log('Testing CSV export...');
try {
  const csv = await generatePlayersCSV([testPlayer]);
  console.log('CSV generated successfully:', csv.toString().substring(0, 200) + '...');
} catch (error) {
  console.error('Export test failed:', error);
}