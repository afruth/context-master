/**
 * Hattrick Player Export Parser
 * 
 * Parses the text format exported by Hattrick and extracts player data
 * to populate form fields automatically.
 */

export interface HattrickPlayerData {
  name?: string;
  ageYears?: number;
  ageDays?: number;
  nationality?: string;
  position?: string;
  speciality?: string;
  form?: number;
  stamina?: number;
  keeper?: number;
  defending?: number;
  playmaking?: number;
  winger?: number;
  passing?: number;
  scoring?: number;
  setPieces?: number;
  weeklyPay?: number;
  fromTeam?: string;
  tsi?: number;
}

export interface ParseResult {
  success: boolean;
  data?: HattrickPlayerData;
  errors: string[];
  warnings: string[];
}

// Skill level mappings from Hattrick text descriptions to numeric values
const SKILL_MAPPINGS: Record<string, number> = {
  "non-existent": 0,
  "disastrous": 1,
  "wretched": 2,
  "poor": 3,
  "weak": 4,
  "inadequate": 5,
  "passable": 6,
  "solid": 7,
  "excellent": 8,
  "formidable": 9,
  "outstanding": 10,
  "brilliant": 11,
  "magnificent": 12,
  "world class": 13,
  "supernatural": 14,
  "titanic": 15,
  "extraterrestrial": 16,
  "mythical": 17,
  "magical": 18,
  "utopian": 19,
  "divine": 20
};

// Specialty mappings
const SPECIALTY_MAPPINGS: Record<string, string> = {
  "Technical": "Technical",
  "Quick": "Quick",
  "Powerful": "Powerful",
  "Unpredictable": "Unpredictable",
  "Head specialist": "Head specialist"
};

/**
 * Parse Hattrick player export text and extract relevant data
 */
export function parseHattrickPlayer(text: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: HattrickPlayerData = {};

  if (!text || text.trim().length === 0) {
    return {
      success: false,
      errors: ["No input text provided"],
      warnings: []
    };
  }

  const lines = text.split('\n').map(line => line.trim());

  try {
    // Parse player name and ID
    const nameMatch = text.match(/^(.+?)\s*\[playerid=\d+\]/);
    if (nameMatch) {
      data.name = nameMatch[1].trim();
    } else {
      warnings.push("Could not extract player name");
    }

    // Parse age
    const ageMatch = text.match(/(\d+)\s+years\s+and\s+(\d+)\s+days/);
    if (ageMatch) {
      data.ageYears = parseInt(ageMatch[1]);
      data.ageDays = parseInt(ageMatch[2]);
    } else {
      warnings.push("Could not extract player age");
    }

    // Parse nationality
    const nationalityMatch = text.match(/Nationality:\s*(.+?)$/m);
    if (nationalityMatch) {
      data.nationality = nationalityMatch[1].trim();
    } else {
      warnings.push("Could not extract nationality");
    }

    // Parse owner/team (for "from team" field)
    const ownerMatch = text.match(/Owner:\s*(.+?)\s+since/);
    if (ownerMatch) {
      data.fromTeam = ownerMatch[1].trim();
    }

    // Parse TSI
    const tsiMatch = text.match(/TSI:\s*([\d\s]+)/);
    if (tsiMatch) {
      const tsiValue = tsiMatch[1].replace(/\s+/g, ''); // Remove spaces
      data.tsi = parseInt(tsiValue);
    }

    // Parse wage
    const wageMatch = text.match(/Wage:\s*\[money\](\d+)\[\/money\]/);
    if (wageMatch) {
      data.weeklyPay = parseInt(wageMatch[1]);
    } else {
      warnings.push("Could not extract weekly wage");
    }

    // Parse specialty
    const specialtyMatch = text.match(/Specialty:\s*\[b\](.+?)\[\/b\]/);
    if (specialtyMatch) {
      const specialty = specialtyMatch[1].trim();
      if (SPECIALTY_MAPPINGS[specialty]) {
        data.speciality = SPECIALTY_MAPPINGS[specialty];
      } else {
        data.speciality = specialty; // Use as-is if not in mapping
      }
    }

    // Parse form and stamina from first table
    const formMatch = text.match(/\[th\]Form\[\/th\]\[td\](.+?)\s*\((\d+)\)\[\/td\]/);
    if (formMatch) {
      data.form = parseInt(formMatch[2]);
    } else {
      warnings.push("Could not extract form level");
    }

    const staminaMatch = text.match(/\[th\]Stamina\[\/th\]\[td\](.+?)\s*\((\d+)\)\[\/td\]/);
    if (staminaMatch) {
      data.stamina = parseInt(staminaMatch[2]);
    } else {
      warnings.push("Could not extract stamina level");
    }

    // Parse skills from second table
    const skillPatterns = [
      { key: 'keeper', pattern: /\[th\]Keeper\[\/th\]\[td\](?:\[b\])?(.+?)(?:\[\/b\])?\s*\((\d+)\)\[\/td\]/ },
      { key: 'defending', pattern: /\[th\]Defending\[\/th\]\[td\](?:\[b\])?(.+?)(?:\[\/b\])?\s*\((\d+)\)\[\/td\]/ },
      { key: 'playmaking', pattern: /\[th\]Playmaking\[\/th\]\[td\](?:\[b\])?(.+?)(?:\[\/b\])?\s*\((\d+)\)\[\/td\]/ },
      { key: 'winger', pattern: /\[th\]Winger\[\/th\]\[td\](?:\[b\])?(.+?)(?:\[\/b\])?\s*\((\d+)\)\[\/td\]/ },
      { key: 'passing', pattern: /\[th\]Passing\[\/th\]\[td\](?:\[b\])?(.+?)(?:\[\/b\])?\s*\((\d+)\)\[\/td\]/ },
      { key: 'scoring', pattern: /\[th\]Scoring\[\/th\]\[td\](?:\[b\])?(.+?)(?:\[\/b\])?\s*\((\d+)\)\[\/td\]/ },
      { key: 'setPieces', pattern: /\[th\]Set Pieces\[\/th\]\[td\](?:\[b\])?(.+?)(?:\[\/b\])?\s*\((\d+)\)\[\/td\]/ }
    ];

    let skillsFound = 0;
    for (const { key, pattern } of skillPatterns) {
      const match = text.match(pattern);
      if (match) {
        const skillValue = parseInt(match[2]);
        const skillText = match[1].toLowerCase().trim();
        
        // Validate skill value matches text description
        const expectedValue = SKILL_MAPPINGS[skillText];
        if (expectedValue !== undefined && expectedValue !== skillValue) {
          warnings.push(`${key}: Text "${skillText}" doesn't match numeric value ${skillValue}`);
        }
        
        data[key as keyof HattrickPlayerData] = skillValue;
        skillsFound++;
      } else {
        warnings.push(`Could not extract ${key} skill level`);
      }
    }

    // Try to infer position based on highest skills
    if (skillsFound > 0) {
      data.position = inferPositionFromSkills(data);
    }

    // Validation
    if (data.ageYears && (data.ageYears < 15 || data.ageYears > 50)) {
      errors.push(`Invalid age: ${data.ageYears} years (must be 15-50)`);
    }

    if (data.ageDays && (data.ageDays < 0 || data.ageDays > 111)) {
      errors.push(`Invalid age days: ${data.ageDays} (must be 0-111)`);
    }

    // Check if we got at least some essential data
    const hasEssentialData = data.name && data.nationality && (data.ageYears || data.weeklyPay || skillsFound > 0);
    
    if (!hasEssentialData) {
      errors.push("Could not extract essential player data. Please check the format.");
    }

    return {
      success: errors.length === 0,
      data,
      errors,
      warnings
    };

  } catch (error) {
    return {
      success: false,
      errors: [`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}

/**
 * Infer player position based on their highest skills
 */
function inferPositionFromSkills(data: HattrickPlayerData): string {
  const skills = {
    keeper: data.keeper || 0,
    defending: data.defending || 0,
    playmaking: data.playmaking || 0,
    winger: data.winger || 0,
    passing: data.passing || 0,
    scoring: data.scoring || 0
  };

  // Find the highest skill(s)
  const maxSkill = Math.max(...Object.values(skills));
  
  if (maxSkill === 0) {
    return ""; // No clear position
  }

  // Position inference logic
  if (skills.keeper === maxSkill && skills.keeper > 5) {
    return "Goalkeeper";
  }
  
  if (skills.defending === maxSkill) {
    if (skills.winger > skills.playmaking) {
      return "Wingback";
    }
    return "Central Defender";
  }
  
  if (skills.winger === maxSkill) {
    return "Winger";
  }
  
  if (skills.playmaking === maxSkill) {
    return "Playmaker";
  }
  
  if (skills.scoring === maxSkill || skills.passing === maxSkill) {
    return "Forward";
  }

  // Default fallback
  return "Forward";
}

/**
 * Get a summary of what data was successfully extracted
 */
export function getImportSummary(data: HattrickPlayerData): string[] {
  const summary: string[] = [];
  
  if (data.name) summary.push("Player name");
  if (data.ageYears !== undefined) summary.push("Age");
  if (data.nationality) summary.push("Nationality");
  if (data.position) summary.push("Position (inferred)");
  if (data.speciality) summary.push("Specialty");
  if (data.form !== undefined) summary.push("Form");
  if (data.stamina !== undefined) summary.push("Stamina");
  if (data.weeklyPay) summary.push("Weekly wage");
  if (data.fromTeam) summary.push("From team");
  
  const skillsImported = [
    data.keeper, data.defending, data.playmaking, 
    data.winger, data.passing, data.scoring, data.setPieces
  ].filter(skill => skill !== undefined).length;
  
  if (skillsImported > 0) {
    summary.push(`${skillsImported} skill levels`);
  }
  
  return summary;
}