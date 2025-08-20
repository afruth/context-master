import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  calculateProfit,
  calculateWeeksOwned,
  calculatePercentageKept,
} from '../src/lib/calculations';

const prisma = new PrismaClient();

// Realistic Hattrick data arrays
const PLAYER_NAMES = [
  'Marcus Lindqvist', 'Erik Johansson', 'Johan Andersson', 'Michael O\'Connor',
  'Giovanni Rossi', 'Carlos Rodriguez', 'Hans Mueller', 'Pierre Dubois',
  'Andrey Petrov', 'Jan Kowalski', 'Dimitris Papadopoulos', 'Roberto Silva',
  'Ahmed Hassan', 'Kenji Tanaka', 'David Thompson', 'Lars Hansen',
  'Antonio Garcia', 'Nikos Christou', 'Ivan Ivanov', 'Jose Martinez',
  'Francesco Romano', 'Mikael Petersen', 'Stefan Popovic', 'Tomasz Nowak',
  'Paulo Santos', 'Yuki Yamamoto', 'Magnus Olsson', 'Georg Bauer',
  'Alexandre Moreau', 'Alexei Volkov'
];

const NATIONALITIES = [
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Germany', 'England', 'Spain',
  'Italy', 'France', 'Netherlands', 'Belgium', 'Portugal', 'Greece',
  'Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Croatia', 'Serbia',
  'Russia', 'Brazil', 'Argentina', 'Mexico', 'Japan', 'South Korea'
];

const POSITIONS = ['GK', 'DEF', 'MID', 'ATT'];

const SPECIALTIES = [
  'Quick', 'Powerful', 'Technical', 'Head', 'Unpredictable', 'Support',
  null, null, null // Make specialty optional for many players
];

const TEAM_NAMES = [
  'FC Stockholm', 'Barcelona United', 'Real Malmö', 'Manchester City FC',
  'Bayern München', 'Juventus Torino', 'AC Milan', 'Chelsea London',
  'Arsenal FC', 'Liverpool United', 'PSG Paris', 'Borussia Dortmund',
  'Atletico Madrid', 'Inter Milan', 'AS Roma', 'Valencia CF',
  'Sevilla FC', 'Napoli', 'Lazio Roma', 'Tottenham', 'Newcastle United',
  'Everton FC', 'Leicester City', 'West Ham United', 'Brighton FC'
];

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateSkillsForPosition(position: string): {
  keeper?: number;
  defending?: number;
  playmaking?: number;
  winger?: number;
  passing?: number;
  scoring?: number;
  setPieces?: number;
} {
  const baseSkill = randomInt(2, 8); // Most skills between 2-8
  const primarySkill = randomInt(5, 12); // Primary skills higher
  const secondarySkill = randomInt(3, 9); // Secondary skills moderate
  
  switch (position) {
    case 'GK':
      return {
        keeper: randomInt(8, 16), // Keepers have high keeper skill
        defending: randomInt(1, 5),
        playmaking: randomInt(1, 4),
        winger: randomInt(1, 3),
        passing: randomInt(1, 5),
        scoring: randomInt(1, 4),
        setPieces: randomInt(1, 8)
      };
    
    case 'DEF':
      return {
        keeper: randomInt(1, 3),
        defending: primarySkill,
        playmaking: randomInt(2, 7),
        winger: randomInt(1, 6),
        passing: secondarySkill,
        scoring: randomInt(1, 5),
        setPieces: randomInt(1, 8)
      };
    
    case 'MID':
      return {
        keeper: randomInt(1, 3),
        defending: randomInt(3, 8),
        playmaking: primarySkill,
        winger: secondarySkill,
        passing: randomInt(4, 10),
        scoring: randomInt(2, 8),
        setPieces: randomInt(1, 10)
      };
    
    case 'ATT':
      return {
        keeper: randomInt(1, 3),
        defending: randomInt(1, 5),
        playmaking: randomInt(2, 7),
        winger: secondarySkill,
        passing: randomInt(2, 7),
        scoring: primarySkill,
        setPieces: randomInt(1, 8)
      };
    
    default:
      return {
        keeper: baseSkill,
        defending: baseSkill,
        playmaking: baseSkill,
        winger: baseSkill,
        passing: baseSkill,
        scoring: baseSkill,
        setPieces: baseSkill
      };
  }
}

function generatePurchasePrice(position: string, age: number, skills: any): number {
  // Base price influenced by position
  let basePrice: number;
  
  switch (position) {
    case 'GK':
      basePrice = skills.keeper * 50000 + randomInt(-20000, 30000);
      break;
    case 'DEF':
      basePrice = (skills.defending + skills.passing) * 30000 + randomInt(-25000, 40000);
      break;
    case 'MID':
      basePrice = (skills.playmaking + skills.passing + skills.winger) * 25000 + randomInt(-30000, 50000);
      break;
    case 'ATT':
      basePrice = (skills.scoring + skills.passing) * 35000 + randomInt(-25000, 60000);
      break;
    default:
      basePrice = 100000;
  }
  
  // Age factor - younger players more expensive
  const ageFactor = age <= 20 ? 1.5 : age <= 25 ? 1.2 : age <= 28 ? 1.0 : age <= 32 ? 0.8 : 0.6;
  
  // Apply age factor and ensure minimum price
  const finalPrice = Math.max(50000, Math.round(basePrice * ageFactor));
  
  // Cap at reasonable maximum
  return Math.min(finalPrice, 5000000);
}

function generateRealisticSalePrice(purchasePrice: number, weeksOwned: number): number {
  // Factor in training and market conditions
  const trainingGrowth = weeksOwned * randomInt(2000, 8000); // Training impact
  const marketVariation = randomInt(-20, 30) / 100; // Market fluctuation ±30%
  
  let salePrice = purchasePrice + trainingGrowth;
  salePrice = salePrice * (1 + marketVariation);
  
  // Ensure minimum sale price (players don't usually sell for very low amounts)
  return Math.max(Math.round(salePrice), Math.round(purchasePrice * 0.7));
}

async function createTestUsers() {
  console.log('Creating test users...');
  
  const users = [
    {
      email: 'test@hattrick.com',
      username: 'testuser',
      name: 'Test User',
      password: await bcrypt.hash('password123', 10)
    },
    {
      email: 'demo@hattrick.com',
      username: 'demouser',
      name: 'Demo User',
      password: await bcrypt.hash('demo123', 10)
    },
    {
      email: 'trader@hattrick.com',
      username: 'traderuser',
      name: 'Trading Expert',
      password: await bcrypt.hash('trader123', 10)
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData
    });
    createdUsers.push(user);
    console.log(`Created user: ${user.email}`);
  }
  
  return createdUsers;
}

async function createPlayers(users: any[]) {
  console.log('Creating players...');
  
  const allPlayers = [];
  const now = new Date();
  const twoYearsAgo = new Date(now.getTime() - (2 * 365 * 24 * 60 * 60 * 1000));
  
  // Distribute players among users
  const playersPerUser = [12, 10, 8]; // Different amounts for variety
  
  for (let userIndex = 0; userIndex < users.length; userIndex++) {
    const user = users[userIndex];
    const playerCount = playersPerUser[userIndex];
    
    for (let i = 0; i < playerCount; i++) {
      const position = randomElement(POSITIONS);
      const ageYears = randomInt(17, 35);
      const ageDays = randomInt(0, 111); // Hattrick year is 112 days
      const skills = generateSkillsForPosition(position);
      const purchasePrice = generatePurchasePrice(position, ageYears, skills);
      
      // Determine if player is owned or sold (70% owned, 30% sold)
      const isOwned = Math.random() > 0.3;
      
      const playerData = {
        name: randomElement(PLAYER_NAMES),
        ageYears,
        ageDays,
        position,
        nationality: randomElement(NATIONALITIES),
        speciality: randomElement(SPECIALTIES),
        form: randomInt(2, 9),
        stamina: randomInt(4, 9),
        ...skills,
        purchaseDate: randomDate(twoYearsAgo, now),
        purchasePrice,
        fromTeam: randomElement(TEAM_NAMES),
        currentStatus: isOwned ? 'OWNED' : 'SOLD',
        userId: user.id
      };
      
      const player = await prisma.player.create({
        data: playerData
      });
      
      allPlayers.push({ ...player, isOwned });
      console.log(`Created player: ${player.name} (${player.position}) - ${player.currentStatus}`);
    }
  }
  
  return allPlayers;
}

async function createSalaryHistory(players: any[]) {
  console.log('Creating salary history...');
  
  for (const player of players) {
    // Calculate salary based on skills and position
    let baseSalary: number;
    
    switch (player.position) {
      case 'GK':
        baseSalary = (player.keeper || 0) * 2000 + randomInt(500, 2000);
        break;
      case 'DEF':
        baseSalary = ((player.defending || 0) + (player.passing || 0)) * 1000 + randomInt(800, 2500);
        break;
      case 'MID':
        baseSalary = ((player.playmaking || 0) + (player.passing || 0) + (player.winger || 0)) * 800 + randomInt(1000, 3000);
        break;
      case 'ATT':
        baseSalary = ((player.scoring || 0) + (player.passing || 0)) * 1200 + randomInt(1200, 4000);
        break;
      default:
        baseSalary = 5000;
    }
    
    // Ensure reasonable salary range
    baseSalary = Math.max(1000, Math.min(baseSalary, 50000));
    
    // Create initial salary record
    const salaryStart = new Date(player.purchaseDate);
    let currentSalary = baseSalary;
    let currentDate = salaryStart;
    
    // 30% chance of salary changes during ownership
    const hasSalaryChanges = Math.random() < 0.3;
    
    if (hasSalaryChanges && !player.isOwned) {
      // Create 1-2 salary periods for sold players
      const salaryChangeCount = randomInt(1, 2);
      
      for (let i = 0; i <= salaryChangeCount; i++) {
        const isLast = i === salaryChangeCount;
        const endDate = isLast ? null : randomDate(currentDate, new Date());
        
        await prisma.salaryHistory.create({
          data: {
            playerId: player.id,
            weeklyPay: Math.round(currentSalary),
            startDate: currentDate,
            endDate
          }
        });
        
        if (!isLast) {
          // Salary can increase or decrease due to training/age
          const salaryChange = randomInt(-3000, 5000);
          currentSalary = Math.max(1000, currentSalary + salaryChange);
          currentDate = endDate!;
        }
      }
    } else {
      // Single salary record
      await prisma.salaryHistory.create({
        data: {
          playerId: player.id,
          weeklyPay: Math.round(currentSalary),
          startDate: salaryStart,
          endDate: player.isOwned ? null : new Date()
        }
      });
    }
    
    console.log(`Created salary history for ${player.name}: ${Math.round(currentSalary)} LEI/week`);
  }
}

async function createSaleTransactions(players: any[]) {
  console.log('Creating sale transactions...');
  
  const soldPlayers = players.filter(p => !p.isOwned);
  
  for (const player of soldPlayers) {
    // Get salary history to calculate total salary cost
    const salaryHistory = await prisma.salaryHistory.findMany({
      where: { playerId: player.id }
    });
    
    // Generate sale date (after purchase, before now)
    const maxSaleDate = new Date();
    const minSaleDate = new Date(player.purchaseDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // At least 1 week
    const saleDate = randomDate(minSaleDate, maxSaleDate);
    
    // Calculate weeks owned
    const { weeksOwned } = calculateWeeksOwned({
      purchaseDate: player.purchaseDate,
      saleDate
    });
    
    // Calculate percentage kept
    const { percentageKept } = calculatePercentageKept({ weeksOwned });
    
    // Add some variation to percentage (some players sold early, some held longer)
    const actualPercentageKept = Math.max(30, Math.min(93, 
      Math.round(percentageKept + randomInt(-10, 5))
    ));
    
    // Generate realistic sale price
    const salePrice = generateRealisticSalePrice(player.purchasePrice, weeksOwned);
    
    // Calculate average weekly salary for the period
    const totalSalaryCost = salaryHistory.reduce((total, salary) => {
      return total + (salary.weeklyPay * weeksOwned);
    }, 0) / (salaryHistory.length || 1);
    
    // Calculate profit using our calculation function
    const { profit } = calculateProfit({
      saleValue: salePrice,
      percentageKept: actualPercentageKept,
      weeklyExpenses: totalSalaryCost / weeksOwned,
      weeksOwned,
      purchaseValue: player.purchasePrice
    });
    
    await prisma.saleTransaction.create({
      data: {
        playerId: player.id,
        saleDate,
        salePrice,
        percentageKept: actualPercentageKept,
        toTeam: randomElement(TEAM_NAMES),
        notes: Math.random() < 0.3 ? 'Training completed successfully' : null,
        profitLoss: profit
      }
    });
    
    console.log(`Created sale transaction for ${player.name}: ${salePrice} LEI (${profit >= 0 ? '+' : ''}${profit} profit)`);
  }
}

async function main() {
  console.log('Starting database seeding...');
  
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.salaryHistory.deleteMany();
    await prisma.saleTransaction.deleteMany();
    await prisma.player.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    
    // Create test data
    const users = await createTestUsers();
    const players = await createPlayers(users);
    await createSalaryHistory(players);
    await createSaleTransactions(players);
    
    // Summary statistics
    const totalPlayers = await prisma.player.count();
    const ownedPlayers = await prisma.player.count({ where: { currentStatus: 'OWNED' } });
    const soldPlayers = await prisma.player.count({ where: { currentStatus: 'SOLD' } });
    const totalTransactions = await prisma.saleTransaction.count();
    const totalSalaryRecords = await prisma.salaryHistory.count();
    
    console.log('\n=== SEEDING COMPLETED ===');
    console.log(`Users created: ${users.length}`);
    console.log(`Total players: ${totalPlayers}`);
    console.log(`- Owned: ${ownedPlayers}`);
    console.log(`- Sold: ${soldPlayers}`);
    console.log(`Sale transactions: ${totalTransactions}`);
    console.log(`Salary history records: ${totalSalaryRecords}`);
    
    // Calculate some basic stats
    const profitableTransactions = await prisma.saleTransaction.count({
      where: { profitLoss: { gt: 0 } }
    });
    const avgProfit = await prisma.saleTransaction.aggregate({
      _avg: { profitLoss: true }
    });
    
    console.log(`Profitable transactions: ${profitableTransactions}/${totalTransactions}`);
    console.log(`Average profit per transaction: ${Math.round(avgProfit._avg.profitLoss || 0)} LEI`);
    
    console.log('\nSample login credentials:');
    console.log('- Email: test@hattrick.com, Password: password123');
    console.log('- Email: demo@hattrick.com, Password: demo123');
    console.log('- Email: trader@hattrick.com, Password: trader123');
    
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  });