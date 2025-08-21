/**
 * Hattrick Skill Prediction Library
 * 
 * Based on the Foxtrick PsicoTSI algorithm for predicting player main skill levels
 * using wage, age, and TSI data. Ported from the original Foxtrick psico.js module.
 * 
 * Original algorithm by Re4Ver, lizardopoli, and LA-MJ
 * See: https://github.com/foxtrick-ng/foxtrick/blob/master/content/lib/psico.js
 */

import type { PlayerSkills, SkillPredictionInput, SkillPredictionResult } from '@/types/hattrick'

// Skill position mapping for arrays
// [form, stamina, playmaking, winger, scoring, keeper, passing, defending, setPieces]
// Note: Currently unused but kept for reference
// const SKILL_POSITIONS = {
//   FORM: 0,
//   STAMINA: 1,
//   PLAYMAKING: 2,
//   WINGER: 3,
//   SCORING: 4,
//   KEEPER: 5,
//   PASSING: 6,
//   DEFENDING: 7,
//   SET_PIECES: 8
// } as const

// Skill names mapping
const SKILL_NAMES = {
  2: 'Playmaking',
  3: 'Winger', 
  4: 'Scoring',
  5: 'Keeper',
  6: 'Passing',
  7: 'Defending'
} as const

// Wage calculation coefficients for each skill
// Formula: wage = (a * (skill ^ b)) [* c, if secondary skill] [* d, if wage > 20000]
const SKILL_COEFFICIENTS = {
  5: [0.0005010000, 6.4000000000, 0.50, 1.0000], // keeper (placeholder)
  7: [0.0007145560, 6.4607813171, 0.50, 0.7921], // defending
  2: [0.0009418058, 6.4407950328, 0.50, 0.7832], // playmaking
  6: [0.0004476257, 6.5136791026, 0.50, 0.7707], // passing
  3: [0.0004437607, 6.4641257225, 0.50, 0.7789], // winger
  4: [0.0009136982, 6.4090063683, 0.50, 0.7984]  // scoring
} as const

// Neural network weights for TSI-based prediction
const NEURAL_NETWORK_WEIGHTS = {
  'PM': {
    meanp: [0, 6.37560321715818, 6.8295799821269, 9.18572832886573, 3.82265415549598, 3.80478105451296, 3.97028596961573, 3.7316800714924],
    stdp: [1, 1.27931620538792, 2.068121874063, 2.64814773627783, 1.25944526479215, 1.23643585187472, 1.41074883966057, 1.200261576732],
    meant: 3.44951885218574,
    stdt: 0.69620243901134,
    IW: [
      [-0.978045139728464, 0.00301687457750677, -0.048841998968147, -0.404735131313642, -0.0362317679661696, 0.0379976393063689, 0.010290023976103, -0.0147760361492318],
      [0.177344012094537, -0.0314455259871624, -0.013402962769724, -0.0892159635787965, 0.149684600060107, 0.0129173095791169, -0.0627676826414977, -0.0140624018719683],
      [1.36521889783453, -0.00637939702956546, 0.0153705440757856, 0.556447703939989, -0.0241943951441762, -0.0493823748265197, -0.21427629169483, -0.00101793041393101],
      [0.196053426793117, -0.02079754895227, 0.00105220616818506, -0.0444692661662335, -0.125304863742313, 0.000952177286031863, 0.0555651518906449, -0.0497925245034302],
      [0.692342189504846, -0.651215170938504, -0.0773280848125734, -0.0299899107255201, 0.0102778174399698, -0.00729484262085779, 0.019086283284809, -0.0704572408040264],
      [1.58818822767738, -0.00884634038142363, 0.0255779210123106, 0.487506584936556, 0.0814314344175245, -0.251017981688899, 0.0901880561018751, -0.0166380710765307],
      [-0.349984574105507, -0.00620252485894222, 0.0100312003087919, 0.23260892557538, 0.0260982230419322, 0.111026396362525, 0.037817626462384, -0.319122796193367]
    ],
    LW: [1.45005860984466, -5.08419804987079, -3.09594267675791, -2.19350882485451, -3.55681002955351, 0.212673777310428, -2.17305546140852, 0.669079546193561]
  },
  'WG': {
    meanp: [0, 6.11559888579387, 6.38544568245125, 4.19986072423398, 9.07820334261824, 3.78899721448468, 4.09261838440111, 3.94707520891365],
    stdp: [1, 1.35219800030418, 1.87676157709407, 1.60495529959243, 1.92480738248487, 1.23672495343354, 1.35904038569407, 1.42286644873124],
    meant: 3.34828115361494,
    stdt: 0.50248598993484,
    IW: [
      [-0.660772073958308, -0.01833440065284, -0.0878004061319683, 0.00014551774875378, -0.09581305124871, -0.018902774261109, -0.0267581613703629, -0.0533105102621847],
      [0.512421132362667, 0.0382337124466166, 0.0773884058542099, -0.0478971000074065, -0.227090911654096, 0.0749380149540642, -0.0192496230658901, 0.591939574122913],
      [-1.37612347434054, -0.0172255940860493, 0.0372075456228269, 0.732664914012482, -0.636332206449557, 0.0660828680402308, -0.13569710277901, -0.0969683305370428],
      [-0.767604389511557, 0.0164740614163994, 0.0996416926112712, 0.0574768132107605, 0.406081043832447, -0.0338799984024221, -0.755504987651843, 0.0404297482763663],
      [0.51444631220829, 0.0227910340702376, -0.194434226880239, 0.0157033323422596, 0.145696031716467, 0.0280447811851727, 0.0997626514667552, 0.0600548994144656]
    ],
    LW: [-4.87066368568217, -8.12793906828807, -0.56007809906691, 0.451613517207488, 0.354350670244603, 2.07516604461788]
  },
  'SC': {
    meanp: [0, 6.21562558619396, 5.79731757643969, 3.79764584505721, 3.78432751828925, 9.20751266179118, 4.23921403113862, 3.88655974488839],
    stdp: [1, 1.45803238481507, 1.84919443347091, 1.29668412881596, 1.21518918313263, 1.71476790521195, 1.54547609249067, 1.29572069955967],
    meant: 3.45478105603469,
    stdt: 0.44019807215147,
    IW: [
      [1.40301200769146, -0.0193144940635949, 0.0212311747405729, -0.175540588154821, -0.0221115046234967, 0.214900394271821, 0.0193996813745877, -0.0481966024580163],
      [-1.30320677336796, -0.00823005974306588, -0.0639798654429837, -0.0548890263553145, -0.000909477091528763, -0.439094120327123, 0.616393481014018, -0.00643510347147235],
      [0.622274133245999, 0.0155796819413849, 0.231654894650702, -0.0891031925337777, -0.157262349055432, -0.589802519029839, -0.143798421154869, -0.187230559566363],
      [-0.634112378069713, -0.000944335329076177, -0.0544022297082993, 0.0193751289262962, -0.0100586795623683, -0.106747528361095, 9.52666848716332e-005, -0.035002277549141],
      [-0.760416443748201, -0.00710422254483257, -0.0438615652834481, 0.102521784762147, -0.0281872796781719, -0.0687360185898756, 0.0163874310887414, -0.228778191132918],
      [-2.04885929453845, -0.320961567561186, 0.000944441355045404, -0.0305253294471756, -0.00788624645149755, 0.0126358849478757, 0.00808561844967016, -0.00871625102475451],
      [0.283890100480124, 0.0136008146777745, -0.362135507458957, -0.00175774533580776, 0.0181290187333429, 0.220512760178359, 0.044816292969784, 0.032774317851683]
    ],
    LW: [-7.7074616828558, -4.81464556813888, 0.640026643980887, 0.221373217042846, -17.1398121382442, 2.59419730774328, -4.26616397837132, 1.10880653486695]
  },
  'PS': {
    meanp: [0, 5.9037558685446, 6.04694835680751, 4.12323943661972, 4.09976525821596, 4.21713615023474, 7.21807511737088, 4.38615023474178],
    stdp: [1, 1.52228260105579, 1.95290122400408, 1.29144037033675, 1.29438644360604, 1.49333417169661, 0.961187627213399, 1.67817798097032],
    meant: 3.06630240883934,
    stdt: 0.42308172264001,
    IW: [
      [-11.8900701342496, -0.024750835138891, -0.965752396040145, -2.09746089518353, -0.321967528454612, -2.38676435871213, -5.1471801821007, 7.79174276667143],
      [0.529380858245977, 0.0291519802983588, 0.0369583467350457, 0.032424613698893, 0.0329191863310305, 0.0396041328798249, 0.0930316090276224, 0.0356752670740693],
      [2.33113350771975, 3.74579049731695, 7.11876326800507, -7.91110226838671, 3.6497359930875, -3.87258670301254, -3.046829371455, 5.84457458310682]
    ],
    LW: [-3.83433618763949, 0.297797052746795, 8.55140826231407, -0.0817402547000788]
  },
  'DF': {
    meanp: [0, 6.71400113830393, 5.55150825270347, 3.49132043255549, 3.53173022196927, 3.54083665338645, 3.75028457598179, 8.03890153670999],
    stdp: [1, 1.48828675945146, 1.84177487301679, 1.14089446002011, 1.1547523721879, 1.09262970647274, 1.27111995210437, 1.91951279588256],
    meant: 3.07079169070856,
    stdt: 0.54669631751747,
    IW: [
      [0.6857172999329, 0.144851901928772, 0.00732053581209846, 0.142004608852104, 0.322390526898797, 0.541747526748434, 0.00470511682361453, -0.352618377429687],
      [0.620509248945402, -0.0126640050506412, -0.0313294540757459, 0.0726382032031436, -0.0658046623810817, -0.0531578337102174, 0.14309876313257, -0.262817885221702],
      [0.361958560232547, 0.0191873845346643, 0.0940541699357571, -0.042618354807883, 0.123768814062805, 0.178214776227766, 0.0870625029013581, 0.545801377669313],
      [0.807238317377399, 0.050804039114291, 0.0338844355782919, 0.246852103250382, -0.0694942575939604, -0.10098194009457, -0.354751810513075, -0.124777986713548],
      [-0.341621423026568, 0.000309270803772757, 0.00956076398728777, 0.175139999720122, -0.0332175436812512, -0.0333469154384476, 0.0646493157528646, -0.0239336387359904],
      [2.76039548716256, -0.00904355194026333, 1.64943269580411, -0.0338036046909946, -0.198593977982261, -0.109517200651956, -0.167444994960601, -0.230909331468331],
      [1.58875346153719, 0.293418924006587, 0.0211646546315773, 0.0824895902178759, 0.0040093750686147, 0.0394329201279045, 0.020570514119798, -0.0305463551011085]
    ],
    LW: [0.140377452993393, -0.339571400603176, -2.30959398112466, 0.985381658295128, -0.767870805617256, 2.35039694690841, 0.215556071649187, 2.22390988552588]
  }
} as const

// Interfaces now imported from types/hattrick.ts

/**
 * Hyperbolic tangent function
 */
function tanh(x: number): number {
  return Math.tanh(x)
}

/**
 * Get the index of the highest skill level
 * from [form, stamina, playmaking, winger, scoring, keeper, passing, defending, setPieces]
 */
function getMaxSkill(skillsArray: number[]): number {
  let vmax = 0
  let pmax = 0
  for (let i = 2; i < skillsArray.length - 1; i++) {
    if (skillsArray[i] - vmax > 0) {
      vmax = skillsArray[i]
      pmax = i
    }
  }
  return pmax
}

/**
 * Check if player has multiple top skills (ambiguous main skill)
 * Note: Currently unused but kept for potential future use
 */
// function hasUndefinedMainSkill(skillsArray: number[]): boolean {
//   let vmax = 0
//   let pmax = 0
//   for (let i = 2; i < skillsArray.length - 1; i++) {
//     if (skillsArray[i] - vmax > 0) {
//       vmax = skillsArray[i]
//       pmax = i
//     }
//   }
//   for (let i = 2; i < skillsArray.length - 1; i++) {
//     if (skillsArray[i] - skillsArray[pmax] === 0 && i !== pmax) {
//       return true
//     }
//   }
//   return false
// }

/**
 * Check if player is a goalkeeper
 * Note: Currently unused but kept for potential future use
 */
// function isGoalkeeper(maxSkillIndex: number): boolean {
//   return maxSkillIndex === 5
// }

/**
 * Convert PlayerSkills to skills array format used by prediction algorithm
 */
function convertSkillsToArray(skills: PlayerSkills, form: number, stamina: number): number[] {
  return [
    form,
    stamina,
    skills.playmaking || 0,
    skills.winger || 0,
    skills.scoring || 0,
    skills.keeper || 0,
    skills.passing || 0,
    skills.defending || 0,
    skills.setPieces || 0
  ]
}

/**
 * Neural Network simulation for TSI-based prediction
 */
function simulateNeuralNetwork(input: number[], mainSkill: string): number | null {
  const weights = NEURAL_NETWORK_WEIGHTS[mainSkill as keyof typeof NEURAL_NETWORK_WEIGHTS]
  if (!weights) return null

  const { meanp, stdp, IW, LW, meant, stdt } = weights

  // Calculate hidden layer
  const hidden = [1] // bias
  for (let i = 1; i < LW.length; i++) {
    let sum = 0
    for (let j = 0; j < 8; j++) {
      sum += ((input[j] - meanp[j]) / stdp[j]) * IW[i - 1][j]
    }
    hidden.push(tanh(sum))
  }

  // Calculate output
  let output = 0
  for (let k = 0; k < LW.length; k++) {
    output += hidden[k] * LW[k]
  }

  return Math.pow(10, output * stdt + meant)
}

/**
 * Calculate maximum skill level using TSI and neural network
 */
function calculateMaxSkillFromTSI(
  skillsArray: number[],
  tsi: number,
  formSubLevel: 'Low' | 'Avg' | 'High'
): number | null {
  const input = [1, 0, 0, 0, 0, 0, 0, 0]
  
  // Form adjustment
  const formAdjustment = formSubLevel === 'Low' ? 0.01 : formSubLevel === 'High' ? 0.99 : 0.5
  input[1] = Math.min(skillsArray[0] + formAdjustment, 8)
  
  // Other skills
  input[2] = skillsArray[1] < 9 ? skillsArray[1] + 0.25 : skillsArray[1] // stamina
  input[3] = skillsArray[2] + 0.25 // playmaking
  input[4] = skillsArray[3] + 0.25 // winger
  input[5] = skillsArray[4] + 0.25 // scoring
  input[6] = skillsArray[6] + 0.25 // passing
  input[7] = skillsArray[7] + 0.25 // defending

  // Determine main skill
  const maxSkillIndex = getMaxSkill(skillsArray)
  let pskillMax = maxSkillIndex > 5 ? maxSkillIndex - 1 : maxSkillIndex
  pskillMax = pskillMax + 1

  if (input[pskillMax] > 7) {
    input[pskillMax] = input[pskillMax] - 0.2
  } else {
    input[pskillMax] = input[pskillMax] - 0.1
  }

  // Map to main skill string
  const mainSkillMap: Record<number, string> = {
    3: 'PM',
    4: 'WG', 
    5: 'SC',
    6: 'PS',
    7: 'DF'
  }

  const mainSkill = mainSkillMap[pskillMax]
  if (!mainSkill) return null

  // Binary search for skill level
  const level = input[pskillMax]
  let sublevel = 0
  let error = 10000
  let iterations = 0

  while (error > 1 && iterations < 100) {
    const newTSI = simulateNeuralNetwork(input, mainSkill)
    if (!newTSI) break

    if (newTSI > tsi) {
      sublevel = sublevel - Math.pow(0.5, iterations)
    } else {
      sublevel = sublevel + Math.pow(0.5, iterations)
    }

    input[pskillMax] = level + sublevel
    const testTSI = simulateNeuralNetwork(input, mainSkill)
    if (!testTSI) break

    error = Math.abs(testTSI - tsi)
    iterations++
  }

  // Adjust extreme values
  if (sublevel < 0) {
    sublevel = sublevel / 8
  }
  if (sublevel > 1) {
    sublevel = 1 + (sublevel - 1) / 8
  }

  return level + sublevel
}

/**
 * Predict skill level using wage and age
 */
export function predictSkillFromWage(input: SkillPredictionInput): SkillPredictionResult {
  const { skills, wage, age, currencyRate = 1.0 } = input
  const skillsArray = convertSkillsToArray(skills, 7, 7) // Default form=7, stamina=7 for wage calculation
  
  // Convert wage to USD (Foxtrick algorithm is calibrated for USD)
  // Original wage is in user's currency, we need to convert TO USD
  const wageInUSD = wage * currencyRate
  let adjustedWage = wageInUSD
  
  const debugInfo = {
    originalWage: wage,
    currencyRate,
    wageInUSD,
    adjustedWage: wageInUSD,
    mainSkillIndex: -1,
    wageBreakdown: {} as Record<string, number>,
    // Add calculation explanation for debugging
    conversionExplanation: `${wage} × ${currencyRate} = ${wageInUSD} USD`
  }

  // Remove base salary
  adjustedWage -= 250

  // Remove set pieces contribution
  if (skills.setPieces && skills.setPieces > 0) {
    adjustedWage = adjustedWage / (1 + 0.0025 * Math.max(0, skills.setPieces))
  }

  // Apply age adjustment for players 29-37 (convert PlayerAge to decimal years)
  const ageInYears = age.years + (age.days / 112)
  if (ageInYears >= 29 && ageInYears <= 37) {
    adjustedWage = adjustedWage / (1 - (ageInYears - 28) / 10)
  }

  debugInfo.adjustedWage = adjustedWage

  // Find main skill based on wage components
  let mainSkillIndex = 0
  let maxWageLow = 0
  let maxWageHigh = 0
  let isDetectable = false

  for (let skillIndex = 2; skillIndex <= 7; skillIndex++) {
    const skillLevel = skillsArray[skillIndex]
    if (skillLevel < 1) continue

    const coeffs = SKILL_COEFFICIENTS[skillIndex as keyof typeof SKILL_COEFFICIENTS]
    if (!coeffs) continue

    let wageLow = coeffs[0] * Math.pow(skillLevel - 1, coeffs[1])
    let wageHigh = coeffs[0] * Math.pow(skillLevel - 0.01, coeffs[1])

    // Apply >20000 discount
    if (wageLow > 20000) {
      wageLow = 20000 + (wageLow - 20000) * coeffs[3]
    }
    if (wageHigh > 20000) {
      wageHigh = 20000 + (wageHigh - 20000) * coeffs[3]
    }

    debugInfo.wageBreakdown[SKILL_NAMES[skillIndex as keyof typeof SKILL_NAMES] || `Skill${skillIndex}`] = wageLow

    if (wageLow > maxWageLow) {
      mainSkillIndex = skillIndex
      maxWageLow = wageLow
      if (wageLow > maxWageHigh) {
        isDetectable = true
        maxWageHigh = wageHigh
      } else {
        isDetectable = false
      }
    }
  }

  debugInfo.mainSkillIndex = mainSkillIndex

  if (!isDetectable) {
    return {
      predictedMainSkill: 'Unknown',
      predictedSkillLevel: { low: 0, avg: 0, high: 0 },
      confidence: 'Low',
      wagePrediction: { low: 'N/A', avg: 'N/A', high: 'N/A' },
      isDetectable: false,
      debugInfo
    }
  }

  const mainSkillName = SKILL_NAMES[mainSkillIndex as keyof typeof SKILL_NAMES] || 'Unknown'
  const coeffs = SKILL_COEFFICIENTS[mainSkillIndex as keyof typeof SKILL_COEFFICIENTS]

  // Calculate predictions for Low, Avg, High using different subtractFromSkill values
  const calculatePrediction = (predictionType: 'Low' | 'Avg' | 'High') => {
    let subtractFromSkill: number
    switch (predictionType) {
      case 'High':
        subtractFromSkill = 0.01
        break
      case 'Avg':
        subtractFromSkill = 0.5
        break
      default: // Low
        subtractFromSkill = 1.0
        break
    }

    // Start with USD wage for calculation (remove age adjustment for calculation)
    let remainingWage = wageInUSD - 250
    if (skills.setPieces && skills.setPieces > 0) {
      remainingWage = remainingWage / (1 + 0.0025 * Math.max(0, skills.setPieces))
    }

    // Remove secondary skills from wage
    for (let skillIndex = 2; skillIndex <= 7; skillIndex++) {
      if (skillIndex === mainSkillIndex) continue

      const skillLevel = skillsArray[skillIndex]
      if (skillLevel < 1) continue

      const subCoeffs = SKILL_COEFFICIENTS[skillIndex as keyof typeof SKILL_COEFFICIENTS]
      if (!subCoeffs) continue

      const adjustedSkillLevel = skillLevel - subtractFromSkill
      if (adjustedSkillLevel <= 0) continue

      let wageSubComponent = subCoeffs[0] * Math.pow(adjustedSkillLevel, subCoeffs[1])

      // Apply >20000 discount
      if (wageSubComponent > 20000) {
        wageSubComponent = 20000 + (wageSubComponent - 20000) * subCoeffs[3]
      }

      // Secondary skill 50% discount
      wageSubComponent = wageSubComponent * subCoeffs[2]

      if (isNaN(wageSubComponent) || wageSubComponent < 0) {
        wageSubComponent = 0
      }

      remainingWage -= wageSubComponent
      if (remainingWage < 0) return 0 // Return N/A if wage becomes negative
    }

    // Remove >20000 discount for accurate prediction on remaining wage
    if (remainingWage > 20000) {
      remainingWage = 20000 + (remainingWage - 20000) / coeffs[3]
    }

    // Calculate main skill level
    const skillLevel = Math.pow(remainingWage / coeffs[0], 1 / coeffs[1])
    return skillLevel + 1 // +1 because formula uses (skill-1)
  }

  const predictions = {
    low: calculatePrediction('Low'),
    avg: calculatePrediction('Avg'),
    high: calculatePrediction('High')
  }

  // Calculate wage-based predictions
  const wagePredictions = {
    low: predictions.low.toFixed(2),
    avg: predictions.avg.toFixed(2), 
    high: predictions.high.toFixed(2)
  }

  // Determine confidence level
  let confidence: 'Low' | 'Medium' | 'High' = 'Low'
  const currentSkillLevel = skillsArray[mainSkillIndex]
  const predictionRange = predictions.high - predictions.low

  if (predictionRange < 1.0 && currentSkillLevel > 0) {
    confidence = 'High'
  } else if (predictionRange < 2.0) {
    confidence = 'Medium'
  }

  // TSI-based prediction if available
  let tsiPrediction: { low: number; avg: number; high: number } | undefined
  if (input.tsi && input.tsi > 0) {
    const tsiLow = calculateMaxSkillFromTSI(skillsArray, input.tsi, 'Low')
    const tsiAvg = calculateMaxSkillFromTSI(skillsArray, input.tsi, 'Avg')
    const tsiHigh = calculateMaxSkillFromTSI(skillsArray, input.tsi, 'High')

    if (tsiLow !== null && tsiAvg !== null && tsiHigh !== null) {
      tsiPrediction = {
        low: Number(tsiLow.toFixed(2)),
        avg: Number(tsiAvg.toFixed(2)),
        high: Number(tsiHigh.toFixed(2))
      }
    }
  }

  return {
    predictedMainSkill: mainSkillName,
    predictedSkillLevel: {
      low: Number(predictions.low.toFixed(2)),
      avg: Number(predictions.avg.toFixed(2)),
      high: Number(predictions.high.toFixed(2))
    },
    confidence,
    wagePrediction: wagePredictions,
    tsiPrediction,
    isDetectable: true,
    debugInfo
  }
}

/**
 * Get a complete skill prediction analysis
 */
export function getSkillPrediction(input: SkillPredictionInput): SkillPredictionResult {
  return predictSkillFromWage(input)
}